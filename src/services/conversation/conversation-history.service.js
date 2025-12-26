/**
 * Servicio encargado de administrar el historial de mensajes
 * de cada conversación.
 *
 * - Guardar mensajes del usuario y del asistente
 * - Limitar el tamaño del historial para optimizar tokens
 * - Proveer el historial a OpenAI para mantener contexto
 * - Limpiar historial cuando una conversación finaliza
 */

/**
 * Mapa en memoria que almacena el historial de mensajes.
 * La clave es el número telefónico normalizado.
 *
 * Estructura:
 * Map<
 *   phone: string,
 *   messages: Array<{ role: 'user' | 'assistant', content: string }>
 * >
 */
const histories = new Map();

/**
 * Número máximo de mensajes que se conservan por conversación.
 * Esto evita:
 * - Consumo excesivo de tokens en OpenAI
 * - Crecimiento innecesario de memoria
 */
const MAX_HISTORY = 20;

/**
 * Agrega un mensaje al historial de la conversación.
 *
 * @param {string} phone - Número telefónico del usuario
 * @param {'user'|'assistant'} role - Rol del mensaje
 * @param {string} content - Contenido del mensaje
 */
export const addMessageToHistory = (phone, role, content) => {
  // Inicializar historial si no existe
  if (!histories.has(phone)) histories.set(phone, []);

  const history = histories.get(phone);

  // Agregar nuevo mensaje
  history.push({ role, content });

  /**
   * Mantener solo los últimos MAX_HISTORY mensajes.
   * Se eliminan los más antiguos primero (FIFO).
   */
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  histories.set(phone, history);
};

/**
 * Obtiene el historial completo de una conversación.
 *
 * Se utiliza principalmente para enviar contexto
 * a OpenAI al generar respuestas.
 *
 * @param {string} phone - Número telefónico del usuario
 * @returns {Array<{ role: string, content: string }>}
 */
export const getHistory = (phone) => {
  return histories.get(phone) || [];
};

/**
 * Elimina completamente el historial de una conversación.
 *
 * Se llama cuando:
 * - La conversación se cierra
 * - Se ejecuta la limpieza automática
 *
 * @param {string} phone - Número telefónico del usuario
 */
export const clearHistory = (phone) => {
  histories.delete(phone);
};
