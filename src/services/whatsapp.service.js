import axios from "axios";

const api = axios.create({
  baseURL: `https://graph.facebook.com/${process.env.WHATSAPP_VERSION}/${process.env.PHONE_NUMBER_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    "Content-Type": "application/json"
  },
  timeout: 10000, // evitar cuelgues
});

// Enviar mensaje de texto simple
export const sendMessage = async (to, message) => {
  if (!message || message.trim() === "") {
    console.error("Intento de enviar mensaje vacío. Cancelado.");
    return;
  }

  try {
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message }
    };

    const { data } = await api.post("/messages", payload);

    return data;

  } catch (err) {
    const metaError = err.response?.data;
    console.error("Error enviando mensaje a WhatsApp:", metaError || err.message);

    // Token caducado o inválido
    if (metaError?.error?.code === 190) {
      console.error("Token inválido o caducado. Revisa el WHATSAPP_TOKEN.");
    }

    // Rate limit
    if (metaError?.error?.code === 131056) {
      console.error("Estás enviando mensajes demasiado rápido.");
    }

    return null;
  }
};

// Enviar documento
export const sendDocument = async (to, docurl, filename) => {
  if (!docurl || !fileName) {
    console.error("Intento de enviar documento. Cancelado.");
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
    console.error("Error enviando documento a WhatsApp:", metaError || err.message);

    // Token caducado o inválido
    if (metaError?.error?.code === 190) {
      console.error("Token inválido o caducado. Revisa el WHATSAPP_TOKEN.");
    }

    // Rate limit
    if (metaError?.error?.code === 131056) {
      console.error("Estás enviando mensajes demasiado rápido.");
    }

    return null;
  }
};


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
    console.error("Error marcando como leído:", err.response?.data || err.message);
  }
};
