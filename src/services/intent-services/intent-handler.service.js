import {sendMessage, sendDocument, sendImage} from '../whatsapp.service.js'
import {generateResponse} from '../openai.service.js';

export const executeIntention = async (intentConfig, from, text, prompt, phoneNumberId) => {
    const {tipo_accion, config} = intentConfig;


    // Por el momento solo soporta 
    switch(tipo_accion){
        case "send_document":
            const docResponse = await generateResponse(from, text, prompt);
            await sendMessage(from, docResponse, phoneNumberId);

            console.log(`
                Para: ${from}
                url: ${config.documento_url}
                name: ${config.filename}`);

            await sendDocument(
                from, 
                config.document_url,
                config.filename || 'documento',
                phoneNumberId
            );
            break;
        
        case "send_image":
            const imgResponse = await generateResponse(from, text, prompt);
            
            // Enviar imágenes configuradas
            if (config.images && Array.isArray(config.images)) {
                for (let i = 0; i < config.images.length; i++) {
                const img = config.images[i];
                const caption = i === config.images.length - 1 ? imgResponse : "";
                await sendImage(from, img.url, caption, phoneNumberId);
                }
            }
            break;
        
        case "send_text":
            const txtResponse = await generateResponse(from, text, prompt);
            await sendMessage(from, txtResponse, phoneNumberId);
            break;
        
        default:
            console.log("Tipo de accion no soportada")
            break;
    }

};