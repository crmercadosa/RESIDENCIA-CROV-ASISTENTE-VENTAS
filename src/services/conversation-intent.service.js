import openai from "../utils/openai.js";

// Clasifica intención del usuario
export const identifyIntent = async (message) => {
  if (!message || message.trim() === "") {
    return "unknown";
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0, 
    messages: [
      {
        role: "system",
        content: `
            Eres un clasificador de intención para un asistente de ventas.

            Clasifica el mensaje SOLO en una de estas opciones:
            - end_conversation
            - continue
            - unknown

            Reglas:
            - "end_conversation": quiere terminar, no está interesado, no quiere más mensajes.
            - "continue": hace preguntas, sigue conversando, muestra interés.
            - "unknown": no es claro.

            Responde SOLO con una palabra exacta.
        `
      },
      {
        role: "user",
        content: message
      }
    ]
  });

  return completion.choices[0].message.content.trim();
};
