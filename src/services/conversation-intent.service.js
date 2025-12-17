import openai from "../utils/openai.js";

// const END_KEYWORDS = [
//   "no quiero",
//   "ya no",
//   "ya no me interesa",
//   "no me interesa",
//   "no necesito",
//   "ya no quiero nada",
//   "bye",
//   "adiós",
//   "gracias ya no"
// ];

export const identifyIntent = async (message) => {
  if (!message || !message.trim()) return "unknown";

  // const text = message.toLowerCase();

  // // Se utiliza esta regla simple primero para evitar costos innecesarios, si en el mensaje del prospecto existe alguna de estas frases se da por terminada la conversación
  // if (END_KEYWORDS.some(keyword => text.includes(keyword))) {
  //   return "end_conversation";
  // }

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
                  - plans_info - si el mensaje muestra interés por informacion detallada de los planes, paquetes, precios o servicios.
                  - puntocrov_web - si el mensaje muestra interés en el PUNTO DE VENTA WEB.
                  - puntocrov_escritorio - si el mensaje muestra interés en el PUNTO DE VENTA DE ESCRITORIO.
                  - end_conversation - si el mensaje indica que la persona quiere terminar la conversación.
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
