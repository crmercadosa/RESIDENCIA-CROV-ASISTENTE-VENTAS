import openai from "../utils/openai.js";

export const generateResponse = async (incomingMessage) => {
  const prompt = `
    Eres un asistente de WhatsApp. Responde en un tono natural y conversacional.
    Mensaje del usuario: "${incomingMessage}"
    `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "Eres un asistente útil integrado a WhatsApp." },
      { role: "user", content: prompt }
    ]
  });

  const response = completion.choices[0].message.content;
  return response;
};
