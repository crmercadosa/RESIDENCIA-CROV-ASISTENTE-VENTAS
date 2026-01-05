/**
 * Webhook principal de CROV AI
 *
 * - Recibir eventos desde WhatsApp Cloud API
 * - Filtrar eventos irrelevantes (read, delivered, sent)
 * - Normalizar el número telefónico
 * - Identificar intención del usuario
 * - Orquestar respuestas (texto, imagen, documento)
 * - Controlar estados de conversación (activa / cerrada)
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
import { getSucursalData } from './sucursal.service.js';

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
    if  (!value) return;
    const phoneNumberId = value.metadata?.phone_number_id;

    if (!value) return;

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
     * Obtener datos de la sucursal 
     */

    const client_phone = value.metadata?.display_phone_number;

    const sucursalData = await getSucursalData(client_phone);

    if (!sucursalData){
      console.log("Sucursal inexistente o inactiva");
      return;
    }

    /**
     * Verificar estado de conversación
     * Si estaba cerrada, se reabre automáticamente
     */
    if (isConversationClosed(from)) {
      console.log("Reabriendo conversación...");
      reopenConversation(from);
    }

    /**
     * Identificar intención del mensaje
     * Esta capa decide QUÉ quiere el usuario
     */
    const intent = await identifyIntent(text, sucursalData.asistente.id);

    /**
     * Menejar intenciones predeterminadas
     */
    if (intent === "end_conversation") {
      if (!isConversationClosed(from)) {
        closeConversation(from);
        const aiResponse = await generateResponse(from, text, sucursalData.prompt);
        await sendMessage(from, aiResponse, phoneNumberId);
      }
      return;
    }

    /**
     * Menejar las intenciones personalizadas para cada sucursal
     */
    const intenciones = await getSucursalIntents(`${sucursalData.asistente.id}`);
    const intentConfig = intenciones.find(i => i.clave === intent);

    if (intentConfig){
      console.log(`Ejecutando intención personalizada: ${intentConfig.nombre}`);
      updateConversationActivity(from, phoneNumberId);
      await executeIntention (
        intentConfig,
        from,
        text,
        sucursalData.prompt,
        phoneNumberId
      );
      return;
    }

    /**
     * Si el mensaje viene sin intención específica termina en este flujo general.
     * Aqui puden ser preguntas generales, aclaraciones, etc.
     */
    updateConversationActivity(from, phoneNumberId);
    const aiResponse = await generateResponse(from, text, sucursalData.prompt);
    await sendMessage(from, aiResponse, phoneNumberId);

  } catch (err) {
    console.error("Error procesando mensaje:", err);
  }
};


/**
 * Normaliza números telefónicos para WhatsApp
 * Actualmente solo soporta normalizacion de numeros que son de México
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
