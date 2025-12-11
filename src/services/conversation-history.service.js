// conversation-history.service.js

const histories = new Map();

export const addMessageToHistory = (phone, role, content) => {
  if (!histories.has(phone)) {
    histories.set(phone, []);
  }

  histories.get(phone).push({ role, content });

  // limitar historial para no gastar tokens
  if (histories.get(phone).length > 15) {
    histories.get(phone).shift(); 
  }
};

export const getHistory = (phone) => {
  return histories.get(phone) || [];
};

export const clearHistory = (phone) => {
  histories.delete(phone);
};
