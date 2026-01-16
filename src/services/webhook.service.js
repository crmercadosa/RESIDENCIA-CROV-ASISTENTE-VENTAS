/**
 * webhook.service.js
 * Webhook principal de CROV AI
 *
 * - Recibe eventos desde WhatsApp Cloud API
 * - Filtra eventos irrelevantes (read, delivered, sent)
 * - Normaliza el número telefónico
 * - Identifica intención del usuario
 * - Orquesta respuestas (texto, imagen, documento)
 * - Controla estados de conversación (activa / cerrada)
 *
 * Este archivo NO genera respuestas directamente
 * Solo coordina servicios especializados
 */

import 'dotenv/config';
import {
  sendMessage,
  markAsRead
} from './whatsapp.service.js';

import { generateResponse } from './openai.service.js';
import {
  closeConversation,
  updateConversationActivity,
  isConversationClosed,
  reopenConversation
} from './conversation-services/conversation-activity.service.js';

import { identifyIntent } from './conversation-services/conversation-intent.service.js';
import { getSucursalIntents } from './intent-services/intent-cache.service.js';
import { executeIntention } from './intent-services/intent-handler.service.js';
import { getNegocioData } from './negocio.service.js';

/**
 * Procesa mensajes entrantes desde WhatsApp
 *
 * @param {Object} payload - Evento recibido desde WhatsApp Cloud API
 */
const processIncomingMessage = async (payload) => {
  try {

    /**
     * Extraer estructura base del webhook
     */
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    
    if (!value) return;
    
    const phoneNumberId = value.metadata?.phone_number_id;

    /**
     * Ignorar eventos de estado
     * WhatsApp envía:
     * - sent
     * - delivered
     * - read
     * Estos NO deben procesarse como mensajes
     */
    const status = value.statuses?.[0];
    if (status) return;

    /**
     * Obtener mensaje entrante
     */
    const message = value.messages?.[0];
    if (!message) return;

    /**
     * Normalizar número de teléfono
     * - Limpia caracteres
     * - Corrige formato Android
     * - Asegura prefijo MX (+52)
     */
    const from = normalizePhone(message.from);

    /**
     * Validar tipo de mensaje
     * CROV AI solo procesa texto por ahora
     */
    const messageType = message.type;
    if (messageType !== 'text') {
      await markAsRead(message.id, phoneNumberId);
      await sendMessage(
        from,
        "Actualmente solo puedo procesar mensajes de texto. Por favor, envíame un mensaje de texto para que pueda ayudarte.",
        phoneNumberId
      );
      return;
    }

    /**
     * Obtener datos del contacto
     */
    const contact = value.contacts?.[0];
    const name = contact?.profile?.name ?? "Desconocido";
    const text = message.text?.body;

    if (!text) return;

    console.log(`Mensaje recibido de ${name} (${from}): ${text}`);

    /**
     * Marcar mensaje como leído
     */
    await markAsRead(message.id, phoneNumberId);

    /**
     * Obtener número de teléfono del negocio
     * Este es el número registrado en el canal de WhatsApp
     */
    const client_phone = value.metadata?.display_phone_number;

    /**
     * Validar que existe un negocio con ese canal activo
     */
    const negocioData = await getNegocioData(client_phone);

    if (!negocioData) {
      console.log("Negocio inexistente, canal inactivo o sin configuración");
      return;
    }

    /**
     * Validar que existe un asistente activo
     */
    console.log("DEBUG: Validando asistente...", negocioData.asistente);
    if (!negocioData.asistente) {
      console.log("Sin asistente activo configurado");
      return;
    }

    /**
     * Validar que existe configuración de prompt
     */
    console.log("DEBUG: Validando prompt...", negocioData.prompt ? "Existe" : "No existe");
    if (!negocioData.prompt) {
      console.log("Sin prompt ni intenciones configuradas");
      return;
    }

    console.log(`Procesando mensaje para: ${negocioData.negocio.nombre} - Asistente: ${negocioData.asistente.nombre}`);

    /**
     * Verificar estado de conversación
     * Si estaba cerrada, se reabre automáticamente
     */
    console.log("DEBUG: Verificando estado de conversación...");
    if (isConversationClosed(from)) {
      console.log("Reabriendo conversación...");
      reopenConversation(from);
    }

    /**
     * Identificar intención del mensaje
     * Esta capa decide QUÉ quiere el usuario
     */
    console.log("DEBUG: Identificando intención...");
    const intent = await identifyIntent(text, negocioData.asistente.id);
    console.log("DEBUG: Intención identificada:", intent);

    /**
     * Manejar intenciones predeterminadas
     */
    console.log("DEBUG: Verificando intención end_conversation...");
    if (intent === "end_conversation") {
      if (!isConversationClosed(from)) {
        closeConversation(from);
        const aiResponse = await generateResponse(from, text, negocioData.prompt);
        await sendMessage(from, aiResponse, phoneNumberId);
      }
      return;
    }

    /**
     * Manejar las intenciones personalizadas para cada negocio
     */
    console.log("DEBUG: Obteniendo intenciones del asistente...");
    const intenciones = await getSucursalIntents(`${negocioData.asistente.id}`);
    console.log("DEBUG: Intenciones obtenidas:", intenciones);
    const intentConfig = intenciones.find(i => i.clave === intent);

    if (intentConfig) {
      console.log(`Ejecutando intención personalizada: ${intentConfig.nombre}`);
      updateConversationActivity(from, phoneNumberId);
      await executeIntention(
        intentConfig,
        from,
        text,
        negocioData.prompt,
        phoneNumberId
      );
      return;
    }

    /**
     * Si el mensaje viene sin intención específica termina en este flujo general.
     * Aquí pueden ser preguntas generales, aclaraciones, etc.
     */
    console.log("DEBUG: Generando respuesta general...");
    updateConversationActivity(from, phoneNumberId);
    const aiResponse = await generateResponse(from, text, negocioData.prompt);
    console.log("DEBUG: Respuesta generada, enviando mensaje...");
    await sendMessage(from, aiResponse, phoneNumberId);
    console.log("DEBUG: Mensaje enviado exitosamente");

  } catch (err) {
    console.error("Error procesando mensaje:", err);
  }
};


/**
 * Normaliza números telefónicos para WhatsApp
 * Actualmente solo soporta normalización de números que son de México
 *
 * - Elimina caracteres no numéricos
 * - Corrige formato Android (521)
 * - Agrega prefijo México por default
 *
 * @param {string} num
 * @returns {string} teléfono en formato +52XXXXXXXXXX
 */
export const normalizePhone = (num = "") => {
  num = num.replace(/\D/g, "");

  if (num.startsWith("521") && num.length === 13) {
    num = "52" + num.slice(3);
  }

  if (num.length === 10) {
    num = "52" + num;
  }

  return "+" + num;
};

export default {
  processIncomingMessage
};