import prisma from '../../lib/prisma';
import { VehiculoTipo } from '@prisma/client';

export interface ServicioInput {
  nombre: string;
  descripcion?: string;
  vehiculo: VehiculoTipo;
  subtipo: string;
  precio: number;
}

// Etapa 3a: solo lectura, para alimentar el selector de servicio del turno.
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

// Lista completa para el ABM (incluye inactivos, para poder reactivarlos).
export async function getServiciosAdmin() {
  return prisma.servicio.findMany({
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

async function findOrThrow(id: number) {
  const servicio = await prisma.servicio.findUnique({ where: { id } });
  if (!servicio) {
    throw { status: 404, message: 'Servicio no encontrado', code: 'NOT_FOUND' };
  }
  return servicio;
}

export async function createServicio(data: ServicioInput) {
  return prisma.servicio.create({ data });
}

export async function updateServicio(id: number, data: ServicioInput) {
  await findOrThrow(id);
  return prisma.servicio.update({ where: { id }, data });
}

export async function updatePrecio(id: number, precio: number) {
  await findOrThrow(id);
  return prisma.servicio.update({ where: { id }, data: { precio } });
}

export async function desactivarServicio(id: number) {
  await findOrThrow(id);
  return prisma.servicio.update({ where: { id }, data: { activo: false } });
}

export async function reactivarServicio(id: number) {
  await findOrThrow(id);
  return prisma.servicio.update({ where: { id }, data: { activo: true } });
}
