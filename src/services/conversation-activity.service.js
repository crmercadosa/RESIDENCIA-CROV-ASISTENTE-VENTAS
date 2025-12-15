import { sendFinalMessage, sendReminder } from './reminder.service.js';
import { clearHistory } from './conversation-history.service.js';

// El historial se registra por numero del prospecto en un Map
const conversations = new Map();

// Tiempo de inactividad para enviar recordatorio
const INACTIVITY_LIMIT = 1 * 60 * 1000; 
const MAX_REMINDERS = 1;

// Limpia completamente la conversación después de cierto tiempo finalizada la conversación
const CLEANUP_TIMEOUT = 1 * 60 * 1000;

// Estado de la conversación por número
const conversationState = {};

// ------------------------------------
// Limpieza completa de la conversación
// ------------------------------------

const scheduleCleanup = (phone) => {
  setTimeout(() => {
    if (conversations.has(phone)) {
      conversations.delete(phone);
      clearHistory(phone);
      console.log(`Conversación e historial eliminada de memoria: ${phone}`);
    }
  }, CLEANUP_TIMEOUT);
};

// --------------------------
// Estado de la conversación
// --------------------------

export const closeConversation = (phone) => {
  // Estado lógico de la conversación
  conversationState[phone] = {
    ...(conversationState[phone] || {}),
    closed: true
  };

  // Estado de los recordatorios 
  if (conversations.has(phone)) {
    const data = conversations.get(phone);

    if (data.timeoutId) {
      clearTimeout(data.timeoutId);
    }

    conversations.delete(phone);
  }

  // Limpieza de historial de la conversación
  clearHistory(phone);

  console.log(`Conversación cerrada manualmente: ${phone}`);
};


export const isConversationClosed = (phone) => {
  return conversationState[phone]?.closed === true;
};

// ----------------------------
// Actividad de la conversación
// ----------------------------

export const updateConversationActivity = (phone) => {

  // Si estaba cerrada y el usuario vuelve a escribir → reabrir
  if (conversationState[phone]?.closed) {
    conversationState.set(phone, { closed: false });
  };

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

// -----------------------
// Manejar la inactividad
// -----------------------

const handleInactivity = async (phone) => {
  const data = conversations.get(phone);

  if (!data || !data.active) return;

  // Si el numero ya cerró la conversación, no hacer nada para evitar mandar los recordatorios
  if (isConversationClosed(phone)) {
    console.log(`La conversación está cerrada. No se envían recordatorios.`);
    conversations.set(phone, data);
    scheduleCleanup(phone);
    return;
  }

  // Un vez alcanzado el límite de recordatorios, enviar mensaje final y cerrar     
  if (data.remindersSent >= MAX_REMINDERS) {
    await sendFinalMessage(phone);
    data.active = false;
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
