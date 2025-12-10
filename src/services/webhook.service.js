const processIncomingMessage = async (payload) => {
  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];

  if (!message) return;

  const from = message.from;
  const text = message.text?.body;

  console.log('Mensaje de:', from);
  console.log('Texto:', text);

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
