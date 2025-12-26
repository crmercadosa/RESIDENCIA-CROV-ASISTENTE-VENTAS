// Posiblemente este controlador quede obsoleto
import { sendMessage } from '../services/message.service.js';

export const sendTestMessage = async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        error: 'Numero de telefono de destino requerido'
      });
    }

    const result = await sendMessage(to, 'Mensaje de prueba desde la API de WhatsApp Business');

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