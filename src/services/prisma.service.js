import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

const prisma = new PrismaClient({adapter});

export const findActiveSucursalByPhone = async (phone) => {
  return prisma.canal.findFirst({
    where: {
      tipo: 'whatsapp',
      estado: 'activo',

      sucursal: {
        estado: 'activo'
      },

      canal_config: {
        some: {
          config: {
            path: '$.whatsapp_number',
            equals: phone
          }
        }
      }
    },
    select: {
      sucursal: {
        select: {
          id: true,
          nombre_negocio: true
        }
      }
    }
  });
};

export const getAssistant = async (canal_id) => {
  return prisma.asistente.findFirst({
    where:{
      id_canal: canal_id,
      estado: 'activo'
    },select:{
      id: true,
      nombre: true,
    }
  })

}

export const getPrompt = async (asisente_id) => {
  return prisma.prompt.findFirst({
    where:{
      id_asistente: asisente_id
    }, 
    select:{
      prompt_final: true
    }
  })
};

export const getIntention = async (asistente_id) => {
  return prisma.intencion.findMany({
    where:{
      id_asistente: asistente_id
    },
    select:{
      clave: true,
      nombre: true,
      descripcion: true,
      tipo_accion: true,
      config: true
    }
  });
}

