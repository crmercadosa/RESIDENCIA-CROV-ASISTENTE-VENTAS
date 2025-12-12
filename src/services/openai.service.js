import openai from "../utils/openai.js";
import { addMessageToHistory, getHistory } from "./conversation-history.service.js";

export const generateResponse = async (phone, incomingMessage) => {
  try {
    // Guardar mensaje del usuario
    addMessageToHistory(phone, "user", incomingMessage);

    // Recuperar historial
    const history = getHistory(phone);

    // Normalizar historial (evita datos corruptos)
    const safeHistory = history
      .filter(msg => msg?.role && msg?.content)
      .map(msg => ({
        role: msg.role,
        content: String(msg.content).slice(0, 1000) // evita gastar tokens innecesarios
      }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
            Eres CROV AI, el asistente virtual de ventas de CROV.
            Reglas clave:
            - No saludes cada vez.
            - Sigue la conversación de forma natural.
            - No repitas información previa.
            - Responde de forma breve, clara y profesional.
            - Mantén un tono humano y cálido.
            - NO inventes información de la empresa; si no sabes, pregunta.
          `
        },
        ...safeHistory
      ]
    });

    const response = completion.choices?.[0]?.message?.content?.trim();

    if (!response) {
      console.error("OpenAI devolvió respuesta vacía. Enviando fallback.");
      return "Lo siento, no entendí bien el mensaje. ¿Podrías repetirlo?";
    }

    // 4. Guardar respuesta del asistente
    addMessageToHistory(phone, "assistant", response);

    return response;

  } catch (err) {
    console.error("Error generando respuesta con OpenAI:", err);

    return "Parece que tengo un problema técnico en este momento 🙏. Inténtalo de nuevo por favor.";
  }
};
