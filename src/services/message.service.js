/**
 * Servicio de integración con WhatsApp Cloud API (Meta)
 *
 * - Centralizar llamadas HTTP hacia WhatsApp
 * - Enviar mensajes de texto, imágenes y documentos
 * - Marcar mensajes como leídos
 * - Manejar errores comunes (token, rate limit)
 *
 * Este servicio NO decide lógica de negocio
 * Solo ejecuta acciones sobre la API de WhatsApp
 */

import axios from "axios";

/**
 * Cliente HTTP configurado para WhatsApp Cloud API
 *
 * Usa:
 * - Versión de API configurada por entorno
 * - PHONE_NUMBER_ID de Meta
 * - Token de acceso seguro
 */
const api = axios.create({
  baseURL: `https://graph.facebook.com/${process.env.WHATSAPP_VERSION}/${process.env.PHONE_NUMBER_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    "Content-Type": "application/json"
  },
  timeout: 10000 // evita colgar el proceso si Meta no responde
});

/**
 * Envía un mensaje de texto simple por WhatsApp
 *
 * @param {string} to - Número destino en formato internacional (+52...)
 * @param {string} message - Texto a enviar
 */
export const sendMessage = async (to, message) => {

  // Validación defensiva
  if (!message || message.trim() === "") {
    console.error("Intento de enviar mensaje vacío. Cancelado.");
    return;
  }

  try {
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: message
      }
    };

    const { data } = await api.post("/messages", payload);
    return data;

  } catch (err) {
    const metaError = err.response?.data;

    console.error(
      "Error enviando mensaje a WhatsApp:",
      metaError || err.message
    );

    // Token inválido o expirado
    if (metaError?.error?.code === 190) {
      console.error("Token inválido o caducado. Revisa WHATSAPP_TOKEN.");
    }

    // Rate limit de WhatsApp
    if (metaError?.error?.code === 131056) {
      console.error("Estás enviando mensajes demasiado rápido.");
    }

    return null;
  }
};


/**
 * Envía un documento por WhatsApp
 *
 * @param {string} to - Número destino
 * @param {string} docurl - URL pública del documento
 * @param {string} filename - Nombre visible del archivo
 */
export const sendDocument = async (to, docurl, filename) => {

  if (!docurl || !filename) {
    console.error("Intento de enviar documento sin datos. Cancelado.");
    return;
  }

  try {
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: {
        link: docurl,
        filename
      }
    };

    const { data } = await api.post("/messages", payload);
    return data;

  } catch (err) {
    const metaError = err.response?.data;

    console.error(
      "Error enviando documento a WhatsApp:",
      metaError || err.message
    );

    if (metaError?.error?.code === 190) {
      console.error("Token inválido o caducado. Revisa WHATSAPP_TOKEN.");
    }

    if (metaError?.error?.code === 131056) {
      console.error("Estás enviando mensajes demasiado rápido.");
    }

    return null;
  }
};


/**
 * Envía una imagen por WhatsApp
 *
 * @param {string} to - Número destino
 * @param {string} imageUrl - URL pública de la imagen
 * @param {string} caption - Texto opcional de acompañamiento
 */
export const sendImage = async (to, imageUrl, caption = "") => {

  if (!imageUrl) {
    console.error("Intento de enviar imagen sin URL. Cancelado.");
    return;
  }

  try {
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: {
        link: imageUrl,
        ...(caption ? { caption } : {})
      }
    };

    const { data } = await api.post("/messages", payload);
    return data;

  } catch (err) {
    const metaError = err.response?.data;

    console.error(
      "Error enviando imagen a WhatsApp:",
      metaError || err.message
    );

    if (metaError?.error?.code === 190) {
      console.error("Token inválido o caducado. Revisa WHATSAPP_TOKEN.");
    }

    if (metaError?.error?.code === 131056) {
      console.error("Estás enviando mensajes demasiado rápido.");
    }

    return null;
  }
};



/**
 * Marca un mensaje entrante como leído en WhatsApp
 *
 * @param {string} messageId - ID del mensaje recibido
 */
export const markAsRead = async (messageId) => {
  if (!messageId) return;

  try {
    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId
    };

    await api.post("/messages", payload);

  } catch (err) {
    console.error(
      "Error marcando mensaje como leído:",
      err.response?.data || err.message
    );
  }
};

