/**
 * Servicio encargado de gestionar el estado y ciclo de vida
 * de una conversación con un usuario.
 *
 * - Detectar actividad / inactividad
 * - Enviar recordatorios automáticos
 * - Cerrar conversaciones correctamente
 * - Limpiar memoria e historial
 * - Reabrir conversaciones cuando el usuario vuelve a escribir
 */

import { sendFinalMessage, sendReminder } from './conversation-reminder.service.js';
import { clearHistory } from './conversation-history.service.js';

/**
 * Mapa en memoria que mantiene el estado de cada conversación
 * La clave es el número telefónico normalizado.
 */
const conversations = new Map();

/**
 * Tiempo máximo de inactividad antes de enviar un recordatorio
 * (1 minuto)
 */
const INACTIVITY_LIMIT = 1 * 60 * 1000;

/**
 * Cantidad máxima de recordatorios antes de cerrar la conversación
 */
const MAX_REMINDERS = 1;

/**
 * Tiempo después del cierre para eliminar completamente
 * la conversación y su historial
 */
const CLEANUP_TIMEOUT = 1 * 60 * 1000;

// ==============================
// Helpers internos
// ==============================

/**
 * Obtiene el estado de conversación para un teléfono.
 * Si no existe, lo inicializa con valores por defecto.
 */
const getConversation = (phone) => {
  if (!conversations.has(phone)) {
    conversations.set(phone, {
      closed: false,               // Indica si la conversación fue cerrada explícitamente
      active: true,                // Indica si el usuario sigue interactuando
      remindersSent: 0,            // Recordatorios enviados por inactividad
      lastActivity: Date.now(),    // Timestamp de la última interacción
      timeoutId: null,             // Timeout principal de inactividad
      cleanupTimeoutId: null,      // Timeout para limpieza total
    });
  }
  return conversations.get(phone);
};

/**
 * Cancela el timeout de limpieza si existe
 * (por ejemplo, cuando el usuario vuelve a escribir)
 */
const cancelCleanup = (data) => {
  if (data.cleanupTimeoutId) {
    clearTimeout(data.cleanupTimeoutId);
    data.cleanupTimeoutId = null;
  }
};

/**
 * Programa la eliminación completa de la conversación
 * y su historial después de cierto tiempo
 */
const scheduleCleanup = (phone) => {
  const data = conversations.get(phone);
  if (!data) return;

  cancelCleanup(data);

  data.cleanupTimeoutId = setTimeout(() => {
    conversations.delete(phone);
    clearHistory(phone);
    console.log(`Conversación e historial eliminados: ${phone}`);
  }, CLEANUP_TIMEOUT);
};

// ==============================
// Estado de conversación
// ==============================

/**
 * Cierra manualmente una conversación.
 * Se utiliza cuando el usuario indica explícitamente
 * que no desea continuar.
 */
export const closeConversation = (phone) => {
  const data = getConversation(phone);

  data.closed = true;
  data.active = false;

  // Cancelar temporizador de inactividad
  if (data.timeoutId) {
    clearTimeout(data.timeoutId);
    data.timeoutId = null;
  }

  // Programar limpieza final
  scheduleCleanup(phone);

  console.log(`Conversación cerrada manualmente: ${phone}`);
};

/**
 * Verifica si una conversación está cerrada
 */
export const isConversationClosed = (phone) => {
  return conversations.get(phone)?.closed === true;
};

/**
 * Reabre una conversación cerrada automáticamente
 * cuando el usuario vuelve a escribir
 */
export const reopenConversation = (phone) => {
  const data = getConversation(phone);

  cancelCleanup(data);

  data.closed = false;
  data.active = true;
  data.remindersSent = 0;

  console.log(`Conversación reabierta: ${phone}`);
};

// ==============================
// Actividad del chat
// ==============================

/**
 * Actualiza la actividad de la conversación.
 * Se debe llamar cada vez que el usuario envía un mensaje válido.
 */
export const updateConversationActivity = (phone) => {
  const data = getConversation(phone);

  // Si estaba cerrada, se reabre automáticamente
  if (data.closed) {
    reopenConversation(phone);
  }

  // Reiniciar timeout de inactividad
  if (data.timeoutId) clearTimeout(data.timeoutId);

  data.lastActivity = Date.now();
  data.active = true;

  data.timeoutId = setTimeout(() => {
    handleInactivity(phone);
  }, INACTIVITY_LIMIT);
};

// ==============================
// Manejo de inactividad
// ==============================

/**
 * Maneja la inactividad del usuario.
 * - Envía recordatorios
 * - Cierra la conversación si se alcanza el límite
 */
const handleInactivity = async (phone) => {
  const data = conversations.get(phone);
  if (!data || !data.active) return;

  // No hacer nada si ya está cerrada
  if (data.closed) return;

  // Si ya se enviaron todos los recordatorios
  if (data.remindersSent >= MAX_REMINDERS) {
    await sendFinalMessage(phone);
    data.active = false;
    data.closed = true;
    scheduleCleanup(phone);
    return;
  }

  try {
    // Enviar recordatorio amistoso
    await sendReminder(phone);

    data.remindersSent++;

    // Programar siguiente chequeo
    data.timeoutId = setTimeout(
      () => handleInactivity(phone),
      INACTIVITY_LIMIT
    );
  } catch (err) {
    console.error("Error enviando recordatorio:", err);
  }
};
