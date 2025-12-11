// reminder.service.js
import { sendMessage } from "./whatsapp.service.js";
import openai from "../utils/openai.js";
import { getHistory, addMessageToHistory } from "./conversation-history.service.js";

export const sendReminder = async (phone) => {
  const history = getHistory(phone);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
        Eres CROV AI, asistente virtual de ventas.

        El cliente dejó de responder y necesitas enviar un recordatorio.

        Reglas:
        - Genera una sola frase.
        - No saludes ni empieces con "hola".
        - Sé amable, humano y breve.
        - Personaliza el mensaje según el historial.
        - NO repitas mensajes anteriores del asistente.
        - Puedes continuar la conversación como si hubieras estado esperando respuesta.
        `
      },
      {
        role: "system",
        content: `
            Historial completo (incluye recordatorios previos, preguntas del cliente y tus respuestas):
            ${JSON.stringify(history)}
            `
      },
      {
        role: "user",
        content: "Envía un recordatorio ahora."
      }
    ]
  });

  const reminderText = completion.choices[0].message.content.trim();

  // Guardar en el historial como mensaje del asistente
  addMessageToHistory(phone, "assistant", reminderText);

  // Enviar por WhatsApp
  await sendMessage(phone, reminderText);
};

export const sendFinalMessage = async (phone) => {
  const history = getHistory(phone);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
        Eres CROV AI, asistente virtual de ventas.

        El cliente dejó de responder y necesitas enviar un mensaje final para despedirte.

        Reglas:
        - Genera una sola frase.
        - No saludes ni empieces con "hola".
        - Sé amable, humano y breve.
        - Recuerda al cliente que puede contactarte cuando quiera.
        - Personaliza el mensaje según el historial.
        - NO repitas mensajes anteriores del asistente.        `
      },
      {
        role: "system",
        content: `
            Historial completo (incluye recordatorios previos, preguntas del cliente y tus respuestas):
            ${JSON.stringify(history)}
            `
      },
      {
        role: "user",
        content: "Envía un recordatorio ahora."
      }
    ]
  });

  const reminderText = completion.choices[0].message.content.trim();

  // Enviar por WhatsApp
  await sendMessage(phone, reminderText);
};
