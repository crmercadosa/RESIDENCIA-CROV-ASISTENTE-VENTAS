import { sendMessage, sendDocument, sendImage, markAsRead } from './whatsapp.service.js';
import { generateResponse } from './openai.service.js';
import { closeConversation, updateConversationActivity, isConversationClosed } from './conversation-activity.service.js';
import { identifyIntent } from './conversation-intent.service.js';

const processIncomingMessage = async (payload) => {
  try {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) return;

    // Ignorar eventos tipo "sent", "delivered", "read"
    const status = value.statuses?.[0];
    if (status) return;

    const message = value.messages?.[0];
    if (!message) return;
    
    // Normalizar número de teléfono (por el momento solo México)
    const from = normalizePhone(message.from);

    // Validar que el tipo de mensaje que llega sea de texto
    const messageType = message.type;
    if (messageType !== 'text') {
        await markAsRead(message.id);
        await sendMessage(from, "Actualmente solo puedo procesar mensajes de texto. Por favor, envíame un mensaje de texto para que pueda ayudarte.");
      return;
    }

    const contact = value.contacts?.[0];
    const name = contact?.profile?.name ?? "Desconocido";
    const text = message.text?.body;

    if (!text) return;

    console.log(`Mensaje recibido de ${name} (${from}): ${text}`);

    // Marcar como leído
    await markAsRead(message.id);

    // Si ya estaba cerrada, reabrir automáticamente
    if (isConversationClosed(from)) {
      console.log("Reabriendo conversación...");
    }

    // Identificar intención del mensaje
    const intent = await identifyIntent(text);

    if (intent === "end_conversation") {
      if (!isConversationClosed(from)) {
        closeConversation(from);
        const aiResponse = await generateResponse(from, text);
        await sendMessage(from, aiResponse);
      }
      return;
    }

    if (intent === "plans_info") {
      updateConversationActivity(from);

      const aiResponse = await generateResponse(from, text);

      sendImage(from, "https://digitalperformance.com.mx/wp-content/uploads/2024/09/Captura-de-pantalla-2024-09-29-121246.png", aiResponse);
      return;
    }

    if (intent === "puntocrov_web") {
      console.log("Usuario interesado en Punto de Venta de web");
      updateConversationActivity(from);
      const aiResponse = await generateResponse(from, text);
      await sendMessage(from, aiResponse);
      await sendDocument(from, "https://firebasestorage.googleapis.com/v0/b/edunote-ittepic.appspot.com/o/ejemplo_crov.pdf?alt=media&token=4813b0cc-2462-4c54-b4e5-31a4579ec1dd", "CROV_Punto_de_Venta_Web.pdf");
      return;
    }

    if (intent === "puntocrov_escritorio") {
      console.log("Usuario interesado en Punto de Venta de Escritorio");
      updateConversationActivity(from);
      const aiResponse = await generateResponse(from, text);
      await sendMessage(from, aiResponse);
      await sendDocument(from, "https://firebasestorage.googleapis.com/v0/b/edunote-ittepic.appspot.com/o/ejemplo_crov.pdf?alt=media&token=4813b0cc-2462-4c54-b4e5-31a4579ec1dd", "CROV_Punto_de_Venta_Web.pdf");
      return;
    }

    updateConversationActivity(from);

    const aiResponse = await generateResponse(from, text);
    await sendMessage(from, aiResponse);

  } catch (err) {
    console.error("Error procesando mensaje:", err);
  }
};

export const normalizePhone = (num = "") => {
  num = num.replace(/\D/g, "");

  // Quitar 521 cuando viene de Android "envía como SMS"
  if (num.startsWith("521") && num.length === 13) {
    num = "52" + num.slice(3);
  }

  // Si no tiene país → agregar México por default
  if (num.length === 10) {
    num = "52" + num;
  }

  return "+" + num;
};

export default {
  processIncomingMessage
};
