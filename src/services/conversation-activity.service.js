import { sendFinalMessage, sendReminder } from './reminder.service.js';

// conversation-activity.service.js
const conversations = new Map();

// Tiempo de inactividad antes de enviar recordatorio (ms)
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutos
// Cantidad máxima de recordatorios
const MAX_REMINDERS = 1;

export const updateConversationActivity = (phone) => {
  const data = conversations.get(phone) || {};

  // Si ya existía un timeout, limpiarlo
  if (data.timeoutId) {
    clearTimeout(data.timeoutId);
  }

  // Registrar actividad
  data.lastActivity = Date.now();

  // Resetear solo si es un nuevo mensaje real del cliente
  data.remindersSent = 0;
  data.active = true;

  // Programar el primer recordatorio
  data.timeoutId = setTimeout(() => {
    handleInactivity(phone);
  }, INACTIVITY_LIMIT);

  conversations.set(phone, data);
};

const handleInactivity = async (phone) => {
  const data = conversations.get(phone);
  if (!data || !data.active) return;

  // Ver si ya se enviaron todos los recordatorios
  if (data.remindersSent >= MAX_REMINDERS) {
    await sendFinalMessage(phone);
    data.active = false;
    conversations.set(phone, data);
    return;
  }

  try {

    await sendReminder(phone);

    data.remindersSent++;
    conversations.set(phone, data);

    // Programar el siguiente recordatorio
    if (data.remindersSent < MAX_REMINDERS) {
      data.timeoutId = setTimeout(() => handleInactivity(phone), INACTIVITY_LIMIT);
    }

  } catch (e) {
    console.error("Error enviando recordatorio:", e);
  }
};
