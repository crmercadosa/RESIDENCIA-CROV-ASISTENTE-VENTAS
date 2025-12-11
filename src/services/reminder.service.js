import { sendMessage } from "./whatsapp.service.js";
import openai from "../utils/openai.js";

export const sendReminder = async (phone) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `Eres el asistente virtual de ventas CROV.
        El usuario lleva varios minutos sin responder.
        Envía un mensaje MUY corto, amable y humano para darle seguimiento.
        No repitas mensajes anteriores.
        No retomes temas viejos.
        Solo una frase.`
      }
    ]
  });

  const reminderText = completion.choices[0].message.content;

  await sendMessage(phone, reminderText);
};
