import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient();

export const findActiveSucursalByPhone = async (phone) => {
  return prisma.canales.findFirst({
    where: {
      numero_telefonico: phone,
      sucursales: {
        estado: 'activo'
      }
    },
    select: {
      sucursales: {
        select: {
          id_sucursal: true,
          nombre_negocio: true
        }
      }
    }
  });
};