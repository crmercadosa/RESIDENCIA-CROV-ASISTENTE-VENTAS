/**
 * Servicio de generación de respuestas con OpenAI (CROV AI).
 *
 * - Generar respuestas inteligentes y contextuales
 * - Mantener continuidad conversacional usando historial
 * - Guiar al usuario hacia una conversión (demo / venta)
 * - Respetar reglas de negocio e intención detectada externamente
 *
 * IMPORTANTE:
 * - Este servicio NO decide intenciones
 * - NO maneja estados de conversación
 * - SOLO responde de forma inteligente
 */

import openai from "../utils/openai.js";
import { addMessageToHistory, getHistory } from "./conversation-history.service.js";

/**
 * Genera una respuesta de CROV AI basada en:
 * - El mensaje entrante del usuario
 * - El historial reciente de la conversación
 * - Un prompt de sistema con reglas comerciales y de tono
 *
 * @param {string} phone - Número del usuario
 * @param {string} incomingMessage - Mensaje recibido
 * @returns {Promise<string>} - Respuesta generada por la IA
 */

export const generateResponse = async (phone, incomingMessage, prompt) => {
  try {

    /**
     * Guardar mensaje del usuario en el historial
     * Esto permite:
     * - Mantener contexto
     * - Personalizar respuestas futuras
     * - Usar el historial para recordatorios y cierres
     */
    addMessageToHistory(phone, "user", incomingMessage);

    /**
     * Recuperar historial completo de la conversación
     */
    const history = getHistory(phone);

    /**
     * Normalizar el historial
     *
     * Protecciones importantes:
     * - Evita mensajes corruptos
     * - Limita longitud para reducir consumo de tokens
     * - Asegura formato correcto role/content
     */
    const safeHistory = history
      .filter(msg => msg?.role && msg?.content)
      .map(msg => ({
        role: msg.role,
        content: String(msg.content).slice(0, 1000)
      }));

    /**
     * Llamada a OpenAI para generar la respuesta
    */
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: prompt
        },
        /**
         * Historial de conversación
         * Permite que la IA responda como si recordara la charla
         */
        ...safeHistory
      ]
    });

    /**
     * Extraer la respuesta generada
     */
    const response = completion.choices?.[0]?.message?.content?.trim();

    /**
     * Fallback de seguridad
     */
    if (!response) {
      console.error("OpenAI devolvió respuesta vacía.");
      return "Lo siento, no entendí bien el mensaje. ¿Podrías repetirlo?";
    }

    /**
     * Guardar la respuesta del asistente en el historial
     */
    addMessageToHistory(phone, "assistant", response);

    /**
     * Retornar respuesta al webhook
     */
    return response;

  } catch (err) {
    console.error("Error generando respuesta con OpenAI:", err);
    /**
     * Fallback ante errores de red, tokens o API
     */
    return "Parece que tengo un problema técnico en este momento. Inténtalo de nuevo por favor.";
  }
};
