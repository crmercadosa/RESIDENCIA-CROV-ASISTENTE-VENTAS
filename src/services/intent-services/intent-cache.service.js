/**
 * Este servicio funciona para traer las configuraciones especificas de cada sucursal
 */

import { getIntention } from "../prisma.service.js";


const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

/**
 * Obtener las intenciones
 */
export const getSucursalIntents = async (asistente_id) => {
    const cached = cache.get(asistente_id);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_TTL){
        return cached.intents;
    }

    //Consultar a la BD
    const intents = await getIntention (asistente_id);

    cache.set(asistente_id,{
        intents,
        timestamp: now
    });

    return intents;
};

export const invalidateIntentionCache = (asistente_id) => {
    cache.delete(asistente_id);
};