import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findActiveSucursalByPhone = async (phone) => {
  return prisma.canales.findFirst({
    where: {
      numero_telefonico: phone,
      sucursales: {
        is: {
          estado: 'activo'
        }
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
