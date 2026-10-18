import prisma from '../../lib/prisma';
import { VehiculoTipo } from '@prisma/client';

// Etapa 3a: solo lectura, para alimentar el selector de servicio del turno.
// El ABM (alta, precio por subtipo, baja) llega en la Etapa 3c.
export async function getServicios(filters: { vehiculo?: VehiculoTipo; subtipo?: string } = {}) {
  return prisma.servicio.findMany({
    where: {
      activo: true,
      ...(filters.vehiculo ? { vehiculo: filters.vehiculo } : {}),
      ...(filters.subtipo ? { subtipo: filters.subtipo } : {}),
    },
    orderBy: [{ vehiculo: 'asc' }, { subtipo: 'asc' }, { nombre: 'asc' }],
  });
}

// Subtipos disponibles para un tipo de vehículo — se derivan de los
// servicios cargados (no es una lista fija, igual que en la demo).
export async function getSubtipos(vehiculo: VehiculoTipo) {
  const servicios = await prisma.servicio.findMany({
    where: { vehiculo, activo: true },
    distinct: ['subtipo'],
    select: { subtipo: true },
    orderBy: { subtipo: 'asc' },
  });
  return servicios.map((s) => s.subtipo);
}
