import { sendMessage } from './whatsapp.service.js';

const processIncomingMessage = async (payload) => {
  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];
  const contact = value?.contacts?.[0];

  if (!message) return;

  // Ignorar mensajes del propio número de WhatsApp Business
  if (message.from === value.metadata.phone_number_id) return;

  const name = contact?.profile?.name || 'Desconocido';
  const from = message.from;
  const text = message.text?.body;

  const phone = normalizePhone(from);

  console.log('Mensaje recibido de:', name);
  console.log('Número:', phone);
  console.log('Texto:', text);

  try {
    const reply = `Hola ${name}, gracias por tu mensaje: "${text}". Te responderemos pronto.`;
    await sendMessage(phone, reply);
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
