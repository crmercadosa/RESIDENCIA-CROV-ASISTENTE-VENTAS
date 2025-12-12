import { sendMessage } from "./whatsapp.service.js";
import openai from "../utils/openai.js";
import { getHistory, addMessageToHistory } from "./conversation-history.service.js";

export const sendReminder = async (phone) => {
  const history = getHistory(phone);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `
        Eres CROV AI. El cliente dejó de responder.

        Reglas:
        - Mensaje corto, natural y humano.
        - No saludes.
        - No repitas recordatorios previos.
        - No suenes desesperado.
        - Personaliza usando el historial.
        `
      },
      {
        role: "system",
        content: `Historial: ${JSON.stringify(history)}`
      },
      {
        role: "user",
        content: "Genera el recordatorio ahora."
      }
    ]
  });

  const reminder = completion.choices[0].message.content.trim();

  addMessageToHistory(phone, "assistant", reminder);

  await sendMessage(phone, reminder);

  return reminder;
};

export const sendFinalMessage = async (phone) => {
  const text =
    "Parece que ya no estás disponible. Si necesitas algo más estaré aquí para ayudarte 😊";
  await sendMessage(phone, text);
};
