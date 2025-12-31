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

import openai from "../../utils/openai.js";
import { getSucursalIntents } from "../intent-services/intent-cache.service.js";

const buildSystemPrompt = (intenciones) => {
  // Intenciones predeterminadas (siempre presentes)

  let prompt = `Eres un clasificador de intención.
    Responde SOLO con una de las siguientes opciones exactas:

    - end_conversation
      Si el usuario expresa intención clara de finalizar la conversación.
      Ejemplos: "adiós", "gracias, eso es todo", "ya no necesito nada"

    - continue
      Si el mensaje forma parte natural de la conversación
      (preguntas generales, respuestas, aclaraciones).

    `;

      // Agregar intenciones personalizadas de la sucursal
      intenciones.forEach(intent => {
        prompt += `- ${intent.clave}
      ${intent.descripcion}
      
    `;
  });

  prompt += `- unknown
  Si la intencion no es clara.
  
  Responde SOLO con una palabra exacta `

  return prompt;

}

export const identifyIntent = async (message, sucursal_id) => {
  try {
    /**
     * Validación básica:
     * Si el mensaje viene vacío o solo con espacios,
     * no se intenta clasificar.
     */
    if (!message || !message.trim()) return "unknown";

    const intenciones = await getSucursalIntents(sucursal_id)

    const systemPrompt = buildSystemPrompt(intenciones);

    /**
     * Llamada a OpenAI para clasificación de intención.
     */
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: systemPrompt
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

  }catch{
    console.log("Error openai")
  }
};
