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
  sendDocument,
  sendImage,
  markAsRead
} from './whatsapp.service.js';

import { generateResponse } from './openai.service.js';
import {
  closeConversation,
  updateConversationActivity,
  isConversationClosed
} from './conversation-activity.service.js';

import { identifyIntent } from './conversation-intent.service.js';
import { findActiveSucursalByPhone } from './prisma-queries.service.js';

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
      await markAsRead(message.id);
      await sendMessage(
        from,
        "Actualmente solo puedo procesar mensajes de texto. Por favor, envíame un mensaje de texto para que pueda ayudarte."
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
    await markAsRead(message.id);

    /**
     * Verificar si existe una sucursal o si está activa
     */
    const client_phone = value.metadata?.display_phone_number;
    const sucursal_res = await findActiveSucursalByPhone(client_phone);

    if (!sucursal_res){
      console.log("Sucursal inexistente o inactiva");
    }
    const {nombre_negocio} = sucursal_res.sucursales;
    console.log("Sucursal encontrada: ",nombre_negocio)

    /**
     * Verificar estado de conversación
     * Si estaba cerrada, se reabre automáticamente
     */
    if (isConversationClosed(from)) {
      console.log("Reabriendo conversación...");
    }

    /**
     * Identificar intención del mensaje
     * Esta capa decide QUÉ quiere el usuario
     */
    const intent = await identifyIntent(text);

    /**
     * Intención: terminar conversación
     */
    if (intent === "end_conversation") {
      if (!isConversationClosed(from)) {
        closeConversation(from);

        const aiResponse = await generateResponse(from, text);
        await sendMessage(from, aiResponse);
      }
      return;
    }

    /**
     * Intención: información de planes
     */
    if (intent === "plans_info") {
      updateConversationActivity(from);

      const aiResponse = await generateResponse(from, text);

      // Se envía imagen + copy generado por IA
      await sendImage(from, process.env.TEST_IMAGE1_URL, "");
      await sendImage(from, process.env.TEST_IMAGE2_URL, aiResponse);
      return;
    }

    /**
     * Intención: Punto de Venta Web
     */
    if (intent === "puntocrov_web") {
      console.log("Usuario interesado en Punto de Venta Web");

      updateConversationActivity(from);

      const aiResponse = await generateResponse(from, text);
      await sendMessage(from, aiResponse);

      await sendDocument(
        from,
        process.env.TEST_PDF_URL,
        "CROV_Punto_de_Venta_Web.pdf"
      );
      return;
    }

    /**
     * Intención: Punto de Venta Escritorio
     */
    if (intent === "puntocrov_escritorio") {
      console.log("Usuario interesado en Punto de Venta Escritorio");

      updateConversationActivity(from);

      const aiResponse = await generateResponse(from, text);
      await sendMessage(from, aiResponse);

      await sendDocument(
        from,
        process.env.TEST_PDF_URL,
        "CROV_POS_Escritorio.pdf"
      );
      return;
    }

    /**
     * Flujo general
     * Mensajes sin intención específica
     */
    updateConversationActivity(from);

    const aiResponse = await generateResponse(from, text);
    await sendMessage(from, aiResponse);

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
