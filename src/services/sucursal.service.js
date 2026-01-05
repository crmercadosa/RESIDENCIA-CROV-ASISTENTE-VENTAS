/**
 * Servicio para datos de sucursales
 * 
 * Este servicio evita consultas repetidas a la base de datos
 */

import { findActiveSucursalByPhone, getAssistant, getPrompt } from './prisma.service.js';

/**
 * Almacén en memoria
 */
const cache = new Map();

/**
 * Tiempo de vida del caché (30 minutos)
 * Después de este tiempo, los datos se revalidan
 */
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

/**
 * Limpieza automática cada 10 minutos
 * Elimina entradas expiradas para evitar datos que no se necesiten en memoria
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
 * - Verifica si existe en caché y no ha expirado
 * - Si existe y es válido, lo retorna
 * - Si no existe o expiró, consulta la BD y actualiza caché
 */
export const getSucursalData = async (phone) => {
  const now = Date.now();
  const cached = cache.get(phone);

  // Si existe en caché y no ha expirado
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`Caché ENCONTRADO para: ${phone}`);
    return {
      sucursal: cached.sucursal,
      prompt: cached.prompt
    };
  }

  console.log(`Caché NO ENCONTRADO para: ${phone} - Consultando BD...`);

  // Consultar base de datos
  const sucursalRes = await findActiveSucursalByPhone(phone);

  console.log(`Sucursal encontrada en BD: ${sucursalRes?.sucursal?.nombre_negocio || 'Ninguna'}`);

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

  //Verificar que existe un asistente activo para ese canal de comunicacion
  const assistantRes =  await getAssistant(sucursalRes.sucursal.id);

  console.log(`Asistente encontrado en BD: ${assistantRes?.nombre || 'Ninguno'}`);

  // Obtener prompt
  const promptRes = await getPrompt(assistantRes.id);

  console.log(`Prompt obtenido de BD para asistente ${assistantRes.nombre}: ${promptRes?.prompt_final}`);

  // Guardar en caché
  const cacheData = {
    sucursal: sucursalRes.sucursal,
    prompt: promptRes?.prompt_final || null,
    asistente: assistantRes || null,
    timestamp: now
  };

  cache.set(phone, cacheData);
  console.log(`Datos cacheados para: ${sucursalRes.sucursal.nombre_negocio} ${sucursalRes.sucursal.id}`);

  return {
    sucursal: cacheData.sucursal,
    prompt: cacheData.prompt,
    asistente: cacheData.asistente
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