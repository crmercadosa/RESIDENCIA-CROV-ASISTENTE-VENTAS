/**
 * Servicio de detección de intención del usuario.
 *
 * - Analizar el mensaje entrante del usuario
 * - Clasificarlo en una intención clara y accionable
 * - Servir como punto de decisión para la lógica del flujo conversacional
 *
 * Este servicio NO responde al usuario.
 * Únicamente clasifica la intención para que el webhook
 * decida qué acción ejecutar.
 */

import openai from "../utils/openai.js";

/**
 * Identifica la intención principal del mensaje del usuario.
 *
 * @param {string} message - Texto recibido del usuario
 * @returns {Promise<string>} - Intención detectada
 *
 * - plans_info
 * - puntocrov_web
 * - puntocrov_escritorio
 * - end_conversation
 * - continue
 * - unknown
 */
export const identifyIntent = async (message) => {

  /**
   * Validación básica:
   * Si el mensaje viene vacío o solo con espacios,
   * no se intenta clasificar.
   */
  if (!message || !message.trim()) return "unknown";

  /**
   * Llamada a OpenAI para clasificación de intención.
   *
   * Se usa:
   * - temperature = 0 → respuestas determinísticas
   * - modelo ligero → bajo costo y rapidez
   *
   * El prompt está diseñado para:
   * - Clasificar SOLO cuando la intención es explícita
   * - Evitar falsas detecciones en frases ambiguas
   */
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
          Eres un clasificador de intención.
          Responde SOLO con una de las siguientes opciones exactas:

          - plans_info
            Si el usuario solicita EXPLÍCITAMENTE información
            sobre planes, paquetes, precios o servicios.
            Ejemplos válidos:
            • "¿Qué planes tienen?"
            • "¿Me puedes hablar de sus precios?"
            • "Información de los planes"

            ! NO clasificar como plans_info si el usuario pregunta:
            • "¿Qué plan me recomiendas?"
            • "¿Cuál se ajusta mejor a mi negocio?"

          - puntocrov_web
            Si el usuario solicita EXPLÍCITAMENTE información
            del Punto de Venta Web.
            Ejemplos válidos:
            • "¿Qué es el punto de venta web?"
            • "Dame información del punto web"

            ! NO clasificar si la pregunta es de recomendación.

          - puntocrov_escritorio
            Si el usuario solicita EXPLÍCITAMENTE información
            del Punto de Venta de Escritorio.
            Ejemplos válidos:
            • "¿Qué es el punto de venta de escritorio?"
            • "Información del POS de escritorio"

            ! NO clasificar si la pregunta es de recomendación.
            
          - agendar_demo
            Si el usuario solicita EXPLÍCITAMENTE agendar o una demostración
            de cualquier sistema.
            Ejemplos válidos:
            • "Quiero agendar una demo"
            • "Me gustaría una demostración del sistema"
            • "Como puedo agendar una demo?"

            ! NO clasificar si la pregunta es de recomendación. 

          - end_conversation
            Si el usuario expresa intención clara de finalizar
            la conversación.

          - continue
            Si el mensaje forma parte natural de la conversación
            (preguntas generales, respuestas, aclaraciones).

          - unknown
            Si la intención no es clara.

          Responde SOLO con una palabra exacta.
        `
      },
      {
        role: "user",
        content: message
      }
    ]
  });

  /**
   * Normalización de la respuesta:
   * - trim() → elimina espacios
   * - toLowerCase() → consistencia
   */
  return completion.choices[0].message.content
    .trim()
    .toLowerCase();
};
