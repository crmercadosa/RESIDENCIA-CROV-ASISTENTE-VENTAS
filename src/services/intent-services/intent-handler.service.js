import {sendMessage, sendDocument, sendImage} from '../whatsapp.service.js'
import {generateResponse} from '../openai.service.js';

export const executeIntention = async (intentConfig, from, text, prompt) => {
    const {tipo_accion, config} = intentConfig;

    switch(tipo_accion){
        case "send_document":
            const docResponse = await generateResponse(from, text, prompt);
            await sendMessage(from, docResponse);

            console.log(`
                Para: ${from}
                url: ${config.documento_url}
                name: ${config.filename}`);

            await sendDocument(
                from, 
                config.document_url,
                config.filename || 'documento'
            );
            break;
        
        case "send_image":
            const imgResponse = await generateResponse(from, text, prompt);
            
            // Enviar imágenes configuradas
            if (config.images && Array.isArray(config.images)) {
                for (let i = 0; i < config.images.length; i++) {
                const img = config.images[i];
                const caption = i === config.images.length - 1 ? imgResponse : "";
                await sendImage(from, img.url, caption);
                }
            }
            break;
        
        case "send_text":
            const txtResponse = await generateResponse(from, text, prompt);
            await sendMessage(from, txtResponse);
            break;
        
        case "send_template":
            // Enviar mensaje predefinido + opcional IA
            if (configuracion.use_ai) {
                const aiResponse = await generateResponse(from, text, prompt);
                await sendMessage(from, aiResponse);
            } else {
                await sendMessage(from, configuracion.template_message);
            }
            break;
        
        case "custom":
            //Para futuras actualizaciones, podría abarcar mas casos personalizados
            break;
        
        default:
            console.log("Tipo de accion no soportada")
            break;
    }

};