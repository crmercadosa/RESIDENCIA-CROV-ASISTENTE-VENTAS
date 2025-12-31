/**
 * Este servicio funciona para traer las configuraciones especificas de cada sucursal
 */

import { getIntention } from "../prisma.service.js";


const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

/**
 * Obtener las intenciones
 */
export const getSucursalIntents = async (sucursal_id) => {
    const cached = cache.get(sucursal_id);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_TTL){
        return cached.intents;
    }

    //Consultar a la BD
    const intents = await getIntention (sucursal_id);

    cache.set(sucursal_id,{
        intents,
        timestamp: now
    });

    return intents;
};

export const invalidateIntentionCache = (sucursal_id) => {
    cache.delete(sucursal_id);
};