// src/controllers/whatsapp.controller.js
import { sendHelloWorld } from '../services/whatsapp.service.js';

export const sendTestMessage = async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        error: 'Numero de telefono de destino requerido'
      });
    }

    const result = await sendHelloWorld(to);

    res.status(200).json({
      message: 'Mensaje enviado correctamente',
      whatsappResponse: result
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      error: 'Error enviando mensaje'
    });
  }
};

