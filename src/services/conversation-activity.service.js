import { sendFinalMessage, sendReminder } from './reminder.service.js';

// El historial se registra por numero del prospecto en un Map
const conversations = new Map();

// Tiempo de inactividad para enviar recordatorio (5 minutos para pruebas)
const INACTIVITY_LIMIT = 5 * 60 * 1000; 
const MAX_REMINDERS = 1;

// Limpia completamente la conversación después de cierto tiempo finalizada la conversación
const CLEANUP_TIMEOUT = 10 * 60 * 1000;

const scheduleCleanup = (phone) => {
  setTimeout(() => {
    if (conversations.has(phone)) {
      conversations.delete(phone);
      console.log(`Conversación eliminada de memoria: ${phone}`);
    }
  }, CLEANUP_TIMEOUT);
};

export const updateConversationActivity = (phone) => {
  let data = conversations.get(phone) || {
    remindersSent: 0,
    active: true,
  };

  // Si hay un timeout viejo limpiarlo y evitar fugas de memoria
  if (data.timeoutId) clearTimeout(data.timeoutId);

  data.lastActivity = Date.now();
  data.remindersSent = 0;
  data.active = true;

  data.timeoutId = setTimeout(() => {
    handleInactivity(phone);
  }, INACTIVITY_LIMIT);

  conversations.set(phone, data);
};

const handleInactivity = async (phone) => {
  const data = conversations.get(phone);

  if (!data || !data.active) return;

  if (data.remindersSent >= MAX_REMINDERS) {
    await sendFinalMessage(phone);
    data.active = false;

    // Agendar limpieza completa
    scheduleCleanup(phone);
    conversations.set(phone, data);
    return;
  }

  try {
    await sendReminder(phone);

    data.remindersSent++;

    data.timeoutId = setTimeout(
      () => handleInactivity(phone),
      INACTIVITY_LIMIT
    );

    conversations.set(phone, data);
  } catch (err) {
    console.error("Error enviando recordatorio:", err);
  }
};
