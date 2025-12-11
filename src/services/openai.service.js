import openai from "../utils/openai.js";

export const generateResponse = async (incomingMessage) => {

 const completion = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  messages: [
    {
      role: "system",
      content: `  Eres el asistente virtual de ventas y soporte de la empresa CROV. CROV es una casa de desarrollo tecnológico especializada en soluciones de punto de venta (POS), software personalizado para negocios, gestión de inventarios, integración de sistemas, analítica con inteligencia artificial y productos tecnológicos escalables para comercios y restaurantes. Ofrecen productos como plataformas web y móviles para administrar ventas, inventario y clientes con soporte continuo y asesoría cercana.
                  Tu tarea es:
                  1. Responder con un tono profesional, amigable, de forma lo mas humana posible y bastante claro.
                  2. Entender las necesidades del cliente y ofrecer soluciones adecuadas dentro de lo que CROV puede brindar.
                  3. No inventar servicios que no existan.
                  4. Si el usuario hace preguntas fuera del alcance de CROV, sugerir contactar a soporte o agendar una consultoría.
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
