import openai from "../utils/openai.js";

const END_KEYWORDS = [
  "no quiero",
  "ya no",
  "no gracias",
  "ya no me interesa",
  "no me interesa",
  "no necesito",
  "ya no quiero nada",
  "bye",
  "adiós",
  "gracias ya no"
];

export const identifyIntent = async (message) => {
  if (!message || !message.trim()) return "unknown";

  const text = message.toLowerCase();

  // Se utiliza esta regla simple primero para evitar costos innecesarios, si en el mensaje del prospecto existe alguna de estas frases se da por terminada la conversación
  if (END_KEYWORDS.some(keyword => text.includes(keyword))) {
    return "end_conversation";
  }

  // OpenAI SOLO si hay duda en la intención del mensaje
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
    Eres un clasificador de intención.
    Responde SOLO:
    - end_conversation
    - continue
    - unknown
            `
        },
        { role: "user", content: message }
        ]
    });

    return completion.choices[0].message.content
        .trim()
        .toLowerCase();
};
