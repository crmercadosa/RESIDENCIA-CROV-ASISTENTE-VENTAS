/**
 * Servicio de recordatorios por inactividad del usuario.
 *
 * - Detectar cuando el usuario dejó de responder
 * - Enviar un recordatorio natural y humano
 * - Mantener continuidad conversacional usando el historial
 * - Cerrar la conversación de forma amable si no hay respuesta
 *
 * Este servicio NO decide cuándo enviar recordatorios,
 * eso lo controla `conversation-activity.service.js`.
 */

import { sendMessage } from "./whatsapp.service.js";
import openai from "../utils/openai.js";
import { getHistory, addMessageToHistory } from "./conversation-history.service.js";

/**
 * Envía un recordatorio inteligente cuando el usuario
 * dejó de responder durante un tiempo definido.
 *
 * @param {string} phone - Número de teléfono del prospecto
 * @returns {Promise<string>} - Texto del recordatorio enviado
 */
export const sendReminder = async (phone) => {

  /**
   * Se recupera el historial de conversación para:
   * - Mantener contexto
   * - Evitar mensajes genéricos
   * - No repetir información ya enviada
   */
  const history = getHistory(phone);

  /**
   * Generación del recordatorio con OpenAI.
   *
   * Se usa:
   * - temperature 0.7 → tono natural y humano
   * - modelo ligero → bajo costo
   *
   * El prompt está diseñado para:
   * - No sonar robótico
   * - No presionar al cliente
   * - No repetir recordatorios anteriores
   * - Simular un vendedor profesional dando seguimiento
   */
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

  /**
   * Se obtiene el texto generado por la IA
   */
  const reminder = completion.choices[0].message.content.trim();

  /**
   * El recordatorio también se guarda en el historial
   * para evitar repeticiones futuras
   */
  addMessageToHistory(phone, "assistant", reminder);

  /**
   * Se envía el recordatorio por WhatsApp
   */
  await sendMessage(phone, reminder);

  return reminder;
};

/**
 * Envía el mensaje final cuando:
 * - Se alcanzó el límite de recordatorios
 * - La conversación se va a cerrar automáticamente
 *
 * Este mensaje:
 * - No presiona
 * - Deja la puerta abierta
 * - Cierra de forma profesional
 *
 * @param {string} phone - Número del prospecto
 */
export const sendFinalMessage = async (phone) => {
  const text =
    "Parece que ya no estás disponible. Si necesitas algo más estaré aquí para ayudarte. ¡Que tengas un excelente día!";

  await sendMessage(phone, text);
};
