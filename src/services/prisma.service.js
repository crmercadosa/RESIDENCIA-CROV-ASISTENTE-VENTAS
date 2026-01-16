/**
 * prisma.service.js
 * Servicio de acceso a datos con Prisma
 * Actualizado para trabajar con la nueva estructura:
 * negocio -> canal -> asistente -> prompt/intenciones
 */

import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

/**
 * Busca un canal activo de WhatsApp por número de teléfono
 * 
 * @param {string} phone - Número de teléfono en formato internacional
 * @returns {Object|null} - Objeto con datos del canal y negocio
 */
export const findActiveCanalByPhone = async (phone) => {
  return prisma.canal.findFirst({
    where: {
      tipo: 'whatsapp',
      estatus: 'activo',
      
      // Validar que el negocio esté activo
      negocio: {
        estatus: 'activo'
      },
      
      // Buscar en el JSON config el número de WhatsApp
      config: {
        path: '$.whatsapp_number',
        equals: phone
      }
    },
    select: {
      id: true,
      tipo: true,
      nombre: true,
      negocio: {
        select: {
          id: true,
          nombre: true,
          giro: true,
          horarios: true,
          ubicacion: true,
          url_pagina: true
        }
      }
    }
  });
};

/**
 * Obtiene el asistente activo de un canal
 * 
 * @param {BigInt} canal_id - ID del canal
 * @returns {Object|null} - Datos del asistente
 */
export const getAssistant = async (canal_id) => {
  return prisma.asistente.findFirst({
    where: {
      id_canal: canal_id,
      estatus: 'activo'
    },
    select: {
      id: true,
      nombre: true,
      tipo: true,
      descripcion: true
    }
  });
};

/**
 * Obtiene el prompt configurado para un asistente
 * 
 * @param {BigInt} asistente_id - ID del asistente
 * @returns {Object|null} - Prompt final del asistente
 */
export const getPrompt = async (asistente_id) => {
  return prisma.prompt.findFirst({
    where: {
      id_asistente: asistente_id
    },
    select: {
      id: true,
      titulo: true,
      prompt_final: true
    }
  });
};

/**
 * Obtiene todas las intenciones activas de un asistente
 * 
 * @param {BigInt} asistente_id - ID del asistente
 * @returns {Array} - Lista de intenciones configuradas
 */
export const getIntention = async (asistente_id) => {
  return prisma.intencion.findMany({
    where: {
      id_asistente: asistente_id,
      activo: 1
    },
    select: {
      id: true,
      clave: true,
      nombre: true,
      descripcion: true,
      tipo_accion: true,
      config: true
    }
  });
};

export default prisma;