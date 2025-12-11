// conversation.service.js
const conversations = new Map();

// Tiempo de inactividad antes de enviar recordatorio (ms)
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutos
// Cantidad máxima de recordatorios
const MAX_REMINDERS = 2;

export const updateConversationActivity = (phone) => {
  const data = conversations.get(phone) || {};

  // Reiniciar si el usuario envía un mensaje
  if (data.timeoutId) clearTimeout(data.timeoutId);

  data.lastActivity = Date.now();
  data.remindersSent = 0;
  data.active = true;

  // Configurar el timeout para recordatorios
  data.timeoutId = setTimeout(() => {
    handleInactivity(phone);
  }, INACTIVITY_LIMIT);

  conversations.set(phone, data);
};

const handleInactivity = async (phone) => {
  const data = conversations.get(phone);
  if (!data || !data.active) return;

  if (data.remindersSent >= MAX_REMINDERS) {
    data.active = false;
    conversations.set(phone, data);
    return;
  }

  try {
    const { sendReminder } = await import('./reminder.service.js');
    await sendReminder(phone);

    data.remindersSent++;
    conversations.set(phone, data);

    // Programar siguiente recordatorio si aplica
    if (data.remindersSent < MAX_REMINDERS) {
      data.timeoutId = setTimeout(() => handleInactivity(phone), INACTIVITY_LIMIT);
    }
  } catch (e) {
    console.error("Error enviando recordatorio:", e);
  }
};
