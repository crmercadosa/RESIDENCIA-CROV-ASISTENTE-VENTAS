import { sendFinalMessage, sendReminder } from './conversation-reminder.service.js';
import { clearHistory } from './conversation-history.service.js';

const conversations = new Map();

const INACTIVITY_LIMIT = 1 * 60 * 1000;
const MAX_REMINDERS = 1;
const CLEANUP_TIMEOUT = 1 * 60 * 1000;

// ==============================
// Helpers
// ==============================

const getConversation = (phone) => {
  if (!conversations.has(phone)) {
    conversations.set(phone, {
      closed: false,
      active: true,
      remindersSent: 0,
      lastActivity: Date.now(),
      timeoutId: null,
      cleanupTimeoutId: null,
    });
  }
  return conversations.get(phone);
};

const cancelCleanup = (data) => {
  if (data.cleanupTimeoutId) {
    clearTimeout(data.cleanupTimeoutId);
    data.cleanupTimeoutId = null;
  }
};

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

export const closeConversation = (phone) => {
  const data = getConversation(phone);

  data.closed = true;
  data.active = false;

  if (data.timeoutId) {
    clearTimeout(data.timeoutId);
    data.timeoutId = null;
  }

  scheduleCleanup(phone);

  console.log(`Conversación cerrada manualmente: ${phone}`);
};

export const isConversationClosed = (phone) => {
  return conversations.get(phone)?.closed === true;
};

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

export const updateConversationActivity = (phone) => {
  const data = getConversation(phone);

  // 🔑 Si estaba cerrada → reabrir correctamente
  if (data.closed) {
    reopenConversation(phone);
  }

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

const handleInactivity = async (phone) => {
  const data = conversations.get(phone);
  if (!data || !data.active) return;

  if (data.closed) return;

  if (data.remindersSent >= MAX_REMINDERS) {
    await sendFinalMessage(phone);
    data.active = false;
    data.closed = true;
    scheduleCleanup(phone);
    return;
  }

  try {
    await sendReminder(phone);

    data.remindersSent++;

    data.timeoutId = setTimeout(
      () => handleInactivity(phone),
      INACTIVITY_LIMIT
    );
  } catch (err) {
    console.error("Error enviando recordatorio:", err);
  }
};
