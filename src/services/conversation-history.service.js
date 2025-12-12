const histories = new Map();
const MAX_HISTORY = 15;

export const addMessageToHistory = (phone, role, content) => {
  if (!histories.has(phone)) histories.set(phone, []);

  const history = histories.get(phone);
  history.push({ role, content });

  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  histories.set(phone, history);
};

export const getHistory = (phone) => {
  return histories.get(phone) || [];
};

export const clearHistory = (phone) => {
  histories.delete(phone);
};
