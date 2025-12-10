export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

export const receiveWebhook = (req, res) => {
  console.log('\n📩 Webhook recibido');
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);
};
