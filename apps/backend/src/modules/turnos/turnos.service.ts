import prisma from '../../lib/prisma';
import { Linea, FormaPago } from '@prisma/client';

const TURNO_INCLUDE = { cliente: true, servicio: true } as const;

function parseFecha(fecha: string): Date {
  // 'fecha' llega como 'YYYY-MM-DD' (sin hora) — se guarda como @db.Date.
  return new Date(`${fecha}T00:00:00.000Z`);
}

export async function getTurnosDelDia(fecha: string) {
  return prisma.turno.findMany({
    where: { fecha: parseFecha(fecha) },
    include: TURNO_INCLUDE,
    orderBy: { hora: 'asc' },
  });
}

export interface CreateTurnoInput {
  fecha: string;
  hora: string;
  linea: Linea;
  clienteId: number;
  servicioId: number;
  patente: string;
  formaPago: FormaPago;
  pagado?: boolean;
  facturar?: boolean;
}

export async function createTurno(data: CreateTurnoInput) {
  return prisma.turno.create({
    data: {
      fecha: parseFecha(data.fecha),
      hora: data.hora,
      linea: data.linea,
      clienteId: data.clienteId,
      servicioId: data.servicioId,
      patente: data.patente,
      formaPago: data.formaPago,
      pagado: data.pagado ?? false,
      facturar: data.facturar ?? true,
    },
    include: TURNO_INCLUDE,
  });
}

export interface UpdateTurnoInput {
  hora: string;
  linea: Linea;
  clienteId: number;
  servicioId: number;
  patente: string;
  formaPago: FormaPago;
  pagado: boolean;
  facturar: boolean;
}

async function findOrThrow(id: number) {
  const turno = await prisma.turno.findUnique({ where: { id } });
  if (!turno) {
    throw { status: 404, message: 'Turno no encontrado', code: 'NOT_FOUND' };
  }
  return turno;
}

export async function updateTurno(id: number, data: UpdateTurnoInput) {
  await findOrThrow(id);
  return prisma.turno.update({ where: { id }, data, include: TURNO_INCLUDE });
}

export async function completarTurno(id: number) {
  await findOrThrow(id);
  return prisma.turno.update({ where: { id }, data: { estado: 'COMPLETADO' }, include: TURNO_INCLUDE });
}

export async function reabrirTurno(id: number) {
  await findOrThrow(id);
  return prisma.turno.update({ where: { id }, data: { estado: 'RESERVADO' }, include: TURNO_INCLUDE });
}

export async function cancelarTurno(id: number) {
  await findOrThrow(id);
  return prisma.turno.update({ where: { id }, data: { estado: 'CANCELADO' }, include: TURNO_INCLUDE });
}

export async function togglePago(id: number) {
  const turno = await findOrThrow(id);
  return prisma.turno.update({ where: { id }, data: { pagado: !turno.pagado }, include: TURNO_INCLUDE });
}

export async function toggleFacturar(id: number) {
  const turno = await findOrThrow(id);
  return prisma.turno.update({ where: { id }, data: { facturar: !turno.facturar }, include: TURNO_INCLUDE });
}
