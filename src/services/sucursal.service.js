import { findActiveSucursalByPhone, getPrompt } from "./prisma-queries.service";

/**
 * Almacén en memoria de la sucursal y el prompt para evitar llamadas a la base de datos cada que se envie un mensaje
 */

const cache = new Map();

/**
 * Tiempo de vida util para el cache
 * Después de este tiempo se revalidan los datos de la sucursal
 */
const cache_time = 15 * 60 * 100; // 15 min

/**
 * Limpieza de la memoria
 * Esto es para evitar que se consuman recursos con información que ya no es necesaria mantener en memoria
 */

setInterval(() => {
    const now = Date.now();
        for ([phone, data] of cache.entries()){
            if (now - data.timestap > cache_time){
                cache.delete(phone);
                console.log(`Caché expirado para: ${phone}`);
            }
        }
}, 10 * 60 * 100); // Cada 10 min


/**
 * Obtener los datos de la sucursal
 * - Primero verifica si hay informacion en caché y no ha expirado
 * - Si lo anterior se cumple, retorna la info
 * - Si no se cumple, ahora si realiza la consulta a la base de datos y actualiza
 */

export const getSucursalData = async(phone) => {
    const now = Date.now();
    const cached = cache.get(phone);

    // Si existe la informacion en memoria y no ha expirado de ese numero se retorna la info para evitar llamar a la bd
    if (cached && (now - cached.timestap) > cache_time) {
        console.log(`Caché vigente para: ${phone}`);
        return {
            sucursal: cached.sucursal,
            prompt: cached.prompt
        }
    }

};


