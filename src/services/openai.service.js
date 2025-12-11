import openai from "../utils/openai.js";
import { addMessageToHistory, getHistory } from "./conversation-history.service.js";

export const generateResponse = async (phone, incomingMessage) => {

   // Guardar mensaje del usuario
  addMessageToHistory(phone, "user", incomingMessage);

  // Consultar eel historial de la conversación
  const history = getHistory(phone);

  const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
        Eres CROV AI, el asistente virtual de ventas de la empresa CROV.
        NO saludes cada vez.
        Habla como si siguieras una conversación activa.
        Evita repetir lo que ya dijiste antes.
        Sé profesional, cálido y útil.
        Responde de forma breve, pero clara.
        `
              },
              ...history
      ]
    });

  const response = completion.choices[0].message.content;

  // Guardar respuesta del asistente
  addMessageToHistory(phone, "assistant", response);

  return response;
};
