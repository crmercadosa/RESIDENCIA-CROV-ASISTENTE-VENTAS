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

  console.log('Mensaje recibido de:', name);
  console.log('Número:', from);
  console.log('Texto:', text);

  const reply = `Hola ${name}, gracias por tu mensaje: "${text}". Te responderemos pronto.`;
  await sendMessage(from, reply);
};

export default {
  processIncomingMessage
};
