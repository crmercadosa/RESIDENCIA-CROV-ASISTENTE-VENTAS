import { sendMessage, markAsRead } from './whatsapp.service.js';
import { generateResponse } from './openai.service.js';

const processIncomingMessage = async (payload) => {
  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  const status = value?.statuses?.[0];
  if (status) return;  // ignorar eventos de status

  const message = value?.messages?.[0];
  if (!message) return;

  const contact = value?.contacts?.[0];
  const name = contact?.profile?.name || 'Desconocido';
  const from = message.from;
  const text = message.text?.body;

  // Marcar como leído
  await markAsRead(message.id);

  const phone = normalizePhone(from);

  console.log('Mensaje recibido de:', name);
  console.log('Número:', phone);
  console.log('Texto:', text);

  const aiResponse = await generateResponse(text);

  try {
    await sendMessage(phone, aiResponse);
  } catch (err) {
    console.error("ERROR AL ENVIAR MENSAJE A META:");
    console.error(err.response?.data || err.message);
  }
};


const normalizePhone = (num) => {
  num = num.replace(/\D/g, "");

  if (num.startsWith("521") && num.length === 13) {
    num = "52" + num.slice(3);
  }
  
  if (!num.startsWith("52")) {
    num = "52" + num;
  }

  return num;
};

export default {
  processIncomingMessage
};
