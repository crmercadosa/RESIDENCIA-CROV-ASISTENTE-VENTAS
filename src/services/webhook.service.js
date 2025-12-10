import { sendMessage } from './whatsapp.service.js';

const processIncomingMessage = async (payload) => {
  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];
  const contact = value?.contacts?.[0];

  if (!message) return;

  const name = contact?.profile?.name || 'Desconocido';
  const from = message.from;
  const text = message.text?.body;
  
  console.log('Mensaje recibido de:', name);
  console.log('Numero:', from);
  console.log('Texto:', text);

  await sendMessage(from, `Hola ${name}, gracias por tu mensaje: "${text}". Te responderemos pronto.`);

  /*
    Logica a futuro no muy lejano:
    - Buscar empresa por número receptor
    - Construir prompt dinámico
    - Llamar OpenAI
    - Enviar respuesta por WhatsApp
  */
};

export default {
  processIncomingMessage
};
