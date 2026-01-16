/**
 * negocio.service.js
 * Servicio para datos de negocios y sus canales
 * 
 * Este servicio evita consultas repetidas a la base de datos
 * mediante un sistema de caché en memoria
 */

import { 
  findActiveCanalByPhone, 
  getAssistant, 
  getPrompt 
} from './prisma.service.js';

import { sendMessage } from './whatsapp.service.js';

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
 * Elimina entradas expiradas para evitar datos innecesarios en memoria
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
 * Obtiene datos de negocio con caché
 * 
 * Flujo:
 * 1. Verifica si existe en caché y no ha expirado
 * 2. Si existe y es válido, lo retorna
 * 3. Si no existe o expiró, consulta la BD y actualiza caché
 * 
 * @param {string} phone - Número de teléfono del canal de WhatsApp
 * @returns {Object|null} - Datos del negocio, asistente y prompt
 */
export const getNegocioData = async (phone, phoneNumberId, from) => {
  const now = Date.now();
  const cached = cache.get(phone);

  // Si existe en caché y no ha expirado
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`Caché ENCONTRADO para: ${phone}`);
    return {
      negocio: cached.negocio,
      canal: cached.canal,
      asistente: cached.asistente,
      prompt: cached.prompt
    };
  }

  console.log(`Caché NO ENCONTRADO para: ${phone} - Consultando BD...`);

  // Consultar base de datos - buscar canal por número
  const canalRes = await findActiveCanalByPhone(phone);

  if (!canalRes) {
    console.log('Canal no encontrado o inactivo');
    
    // Si no existe, cachear como null por un tiempo corto (5 min)
    // Evita martillar la BD con números inválidos
    cache.set(phone, {
      negocio: null,
      canal: null,
      asistente: null,
      prompt: null,
      timestamp: now - (CACHE_TTL - 5 * 60 * 1000) // Expira en 5 min
    });
    return null;
  }

  console.log(`Negocio encontrado: ${canalRes.negocio?.nombre || 'Sin nombre'}`);

  // Verificar que existe un asistente activo para ese canal
  const assistantRes = await getAssistant(canalRes.id);

  if (!assistantRes) {
    await sendMessage(from, 'En estos momentos no estoy disponible, intentalo mas tarde', phoneNumberId);
    return null;
  }

  console.log(`Asistente encontrado: ${assistantRes.nombre}`);

  // Obtener prompt del asistente
  const promptRes = await getPrompt(assistantRes.id);

  if (!promptRes) {
    console.log('Sin prompt ni intenciones configuradas');
  } else {
    console.log(`Prompt configurado: ${promptRes.titulo}`);
  }

  // Guardar en caché
  const cacheData = {
    negocio: canalRes.negocio,
    canal: {
      id: canalRes.id,
      tipo: canalRes.tipo,
      nombre: canalRes.nombre
    },
    asistente: assistantRes,
    prompt: promptRes?.prompt_final || null,
    timestamp: now
  };

  cache.set(phone, cacheData);
  console.log(`Datos cacheados para: ${canalRes.negocio.nombre} (Canal: ${canalRes.id})`);

  return {
    negocio: cacheData.negocio,
    canal: cacheData.canal,
    asistente: cacheData.asistente,
    prompt: cacheData.prompt
  };
};

/**
 * Invalida el caché para un teléfono específico
 * Útil cuando se actualiza el negocio, canal o su prompt
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
      negocio: data.negocio?.nombre || 'null',
      canal: data.canal?.nombre || 'null',
      asistente: data.asistente?.nombre || 'null',
      age: Math.floor((Date.now() - data.timestamp) / 1000) + 's'
    }))
  };
};