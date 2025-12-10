// src/services/whatsapp.service.js
import axios from 'axios';

export const sendMessage = async (to, message) => {
  const url = `https://graph.facebook.com/${process.env.WHATSAPP_VERSION}/${process.env.PHONE_NUMBER_ID}/messages`;

  const response = await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        "body": message
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