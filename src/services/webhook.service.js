import { sendMessage } from './whatsapp.service.js';
import 'dotenv/config';

const processIncomingMessage = async (payload) => {
  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];
  const contact = value?.contacts?.[0];
  const phon_id = value?.metadata?.phone_number_id;

  if (!message) return;

  const name = contact?.profile?.name || 'Desconocido';
  const from = message.from;
  const text = message.text?.body;
  
  
  console.log('Mensaje recibido de:', name);
  console.log('Numero:', from);
  console.log('Texto:', text);
  console.log('Phone Number ID:', phon_id);

  if (phon_id === process.env.PHONE_NUMBER_ID) {return;}

  // Responder al mensaje recibido
  const reply = `Hola ${name}, gracias por tu mensaje: "${text}". Te responderemos pronto.`;
  await sendMessage(from, reply);

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
