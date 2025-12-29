/**
 * Servicio de caché para datos de sucursales
 * 
 * Evita consultas repetidas a la base de datos
 * almacenando temporalmente información de sucursales activas
 */

import { findActiveSucursalByPhone, getPrompt } from './prisma-queries.service.js';

/**
 * Almacén en memoria
 * Estructura: { phone: { sucursal, prompt, timestamp } }
 */
const cache = new Map();

/**
 * Tiempo de vida del caché (30 minutos)
 * Después de este tiempo, los datos se revalidan
 */
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos en milisegundos

/**
 * Limpieza automática cada 10 minutos
 * Elimina entradas expiradas para evitar memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of cache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      cache.delete(phone);
      console.log(`Caché expirado para: ${phone}`);
    }
  }
}, 10 * 60 * 1000);

/**
 * Obtiene datos de sucursal con caché
 * 
 * Flujo:
 * 1. Verifica si existe en caché y no ha expirado
 * 2. Si existe y es válido, lo retorna
 * 3. Si no existe o expiró, consulta la BD y actualiza caché
 * 
 * @param {string} phone - Número de teléfono de la sucursal
 * @returns {Object|null} { sucursal, prompt } o null si no existe
 */
export const getSucursalData = async (phone) => {
  const now = Date.now();
  const cached = cache.get(phone);

  // Si existe en caché y no ha expirado
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`✓ Caché HIT para: ${phone}`);
    return {
      sucursal: cached.sucursal,
      prompt: cached.prompt
    };
  }

  console.log(`✗ Caché MISS para: ${phone} - Consultando BD...`);

  // Consultar base de datos
  const sucursalRes = await findActiveSucursalByPhone(phone);

  if (!sucursalRes?.sucursal) {
    // Si no existe, cachear como null por un tiempo corto (5 min)
    // Evita martillar la BD con números inválidos
    cache.set(phone, {
      sucursal: null,
      prompt: null,
      timestamp: now - (CACHE_TTL - 5 * 60 * 1000) // Expira en 5 min
    });
    return null;
  }

  // Obtener prompt
  const promptRes = await getPrompt(sucursalRes.sucursal.id);

  // Guardar en caché
  const cacheData = {
    sucursal: sucursalRes.sucursal,
    prompt: promptRes?.prompt_final || null,
    timestamp: now
  };

  cache.set(phone, cacheData);
  console.log(`✓ Datos cacheados para: ${sucursalRes.sucursal.nombre_negocio}`);

  return {
    sucursal: cacheData.sucursal,
    prompt: cacheData.prompt
  };
};

/**
 * Invalida el caché para un teléfono específico
 * Útil cuando se actualiza la sucursal o su prompt
 * 
 * @param {string} phone - Número de teléfono
 */
export const invalidateCache = (phone) => {
  if (cache.delete(phone)) {
    console.log(`Caché invalidado para: ${phone}`);
  }
};

/**
 * Invalida todo el caché
 * Útil para refrescar después de cambios masivos
 */
export const clearCache = () => {
  cache.clear();
  console.log('Caché completamente limpiado');
};

/**
 * Obtiene estadísticas del caché
 * Útil para monitoreo
 */
export const getCacheStats = () => {
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([phone, data]) => ({
      phone,
      sucursal: data.sucursal?.nombre_negocio || 'null',
      age: Math.floor((Date.now() - data.timestamp) / 1000) + 's'
    }))
  };
};