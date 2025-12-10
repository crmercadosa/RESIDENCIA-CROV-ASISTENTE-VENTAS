import webhookService from '../services/webhook.service.js';

export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    mode === 'subscribe' &&
    token === process.env.VERIFY_TOKEN
  ) {
    console.log('Webhook verificado');
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

export const receiveMessage = async (req, res) => {
  try {
    console.log('Webhook recibido');
    console.log(JSON.stringify(req.body, null, 2));

    await webhookService.processIncomingMessage(req.body);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error webhook:', error.message);
    res.sendStatus(500);
  }
};
