import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

const prisma = new PrismaClient({adapter});

export const findActiveSucursalByPhone = async (phone) => {
  return prisma.canal.findFirst({
    where: {
      numero_telefonico: phone,
      sucursal: {
        is: {
          estado: 'activo'
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

export const getPrompt = async (sucursal_id) => {
  return prisma.prompt.findFirst({
    where:{
      id_sucursal: sucursal_id
    }, 
    select:{
      prompt_final: true
    }
  })
};

