import openai from "../utils/openai.js";

export const generateResponse = async (incomingMessage) => {
  const prompt = `
    Eres un asistente de WhatsApp. Responde en un tono natural y conversacional.
    Mensaje del usuario: "${incomingMessage}"
    `;

 const completion = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  messages: [
    {
      role: "system",
      content: `
Eres el asistente virtual de ventas y soporte de la empresa CROV. CROV es una casa de desarrollo tecnológico especializada en soluciones de punto de venta (POS), software personalizado para negocios, gestión de inventarios, integración de sistemas, analítica con inteligencia artificial y productos tecnológicos escalables para comercios y restaurantes. Ofrecen plataformas web y móviles para administrar ventas, inventario y clientes con soporte continuo y asesoría cercana. Tu tarea es responder con tono profesional, amigable y claro, entendiendo las necesidades del cliente.
`
    },
    {
      role: "user",
      content: `Usuario dice: "${incomingMessage}"`
    }
  ]
});


  const response = completion.choices[0].message.content;
  return response;
};
