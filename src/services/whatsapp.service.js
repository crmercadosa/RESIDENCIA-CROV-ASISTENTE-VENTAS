// src/services/whatsapp.service.js
import axios from 'axios';

export const sendHelloWorld = async (to) => {
  const url = `https://graph.facebook.com/${process.env.WHATSAPP_VERSION}/${process.env.PHONE_NUMBER_ID}/messages`;

  const response = await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        "body": "Este es un mensaje de prueba desde la API de WhatsApp"
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};
