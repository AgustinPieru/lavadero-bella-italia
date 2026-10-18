import prisma from '../../lib/prisma';
import { VehiculoTipo } from '@prisma/client';

export interface VehiculoInput {
  tipo: VehiculoTipo;
  subtipo: string;
  marca?: string;
  modelo?: string;
  patente?: string;
}

export interface ClienteInput {
  denominacion: string;
  telefono: string;
  cuit?: string;
  email?: string;
  direccion?: string;
}

export interface GetClientesFilters {
  search?: string;
  incluirInactivos?: boolean;
}

const CLIENTE_INCLUDE = { vehiculos: { orderBy: { id: 'asc' as const } } };

export async function getClientes(filters: GetClientesFilters = {}) {
  return prisma.cliente.findMany({
    where: {
      ...(filters.incluirInactivos ? {} : { activo: true }),
      ...(filters.search
        ? {
            OR: [
              { denominacion: { contains: filters.search, mode: 'insensitive' } },
              { telefono: { contains: filters.search, mode: 'insensitive' } },
              { vehiculos: { some: { patente: { contains: filters.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    },
    include: CLIENTE_INCLUDE,
    orderBy: { denominacion: 'asc' },
  });
}

async function findOrThrow(id: number) {
  const cliente = await prisma.cliente.findUnique({ where: { id }, include: CLIENTE_INCLUDE });
  if (!cliente) {
    throw { status: 404, message: 'Cliente no encontrado', code: 'NOT_FOUND' };
  }
  return cliente;
}

export async function getCliente(id: number) {
  return findOrThrow(id);
}

// La alta de un cliente siempre viene con su primer vehículo (no tiene mucho
// sentido un cliente sin ninguno); para sumarle más vehículos después se usa
// addVehiculo.
export async function createCliente(data: ClienteInput & { vehiculo: VehiculoInput }) {
  const { vehiculo, ...clienteData } = data;
  return prisma.cliente.create({
    data: { ...clienteData, vehiculos: { create: [vehiculo] } },
    include: CLIENTE_INCLUDE,
  });
}

export async function updateCliente(id: number, data: ClienteInput) {
  await findOrThrow(id);
  return prisma.cliente.update({ where: { id }, data, include: CLIENTE_INCLUDE });
}

export async function desactivarCliente(id: number) {
  await findOrThrow(id);
  return prisma.cliente.update({ where: { id }, data: { activo: false }, include: CLIENTE_INCLUDE });
}

export async function reactivarCliente(id: number) {
  await findOrThrow(id);
  return prisma.cliente.update({ where: { id }, data: { activo: true }, include: CLIENTE_INCLUDE });
}

// ──────────────────────────────────────────────
// Vehículos — siempre asociados a un cliente. Un cliente puede tener N.
// ──────────────────────────────────────────────

async function findVehiculoOrThrow(id: number) {
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id } });
  if (!vehiculo) {
    throw { status: 404, message: 'Vehículo no encontrado', code: 'NOT_FOUND' };
  }
  return vehiculo;
}

export async function addVehiculo(clienteId: number, data: VehiculoInput) {
  await findOrThrow(clienteId);
  return prisma.vehiculo.create({ data: { ...data, clienteId } });
}

export async function updateVehiculo(id: number, data: VehiculoInput) {
  await findVehiculoOrThrow(id);
  return prisma.vehiculo.update({ where: { id }, data });
}

export async function desactivarVehiculo(id: number) {
  await findVehiculoOrThrow(id);
  return prisma.vehiculo.update({ where: { id }, data: { activo: false } });
}

export async function reactivarVehiculo(id: number) {
  await findVehiculoOrThrow(id);
  return prisma.vehiculo.update({ where: { id }, data: { activo: true } });
}
