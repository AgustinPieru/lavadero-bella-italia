import prisma from '../../lib/prisma';
import { Linea, FormaPago } from '@prisma/client';
import { generarResenaToken, enviarEncuestaResena } from '../../lib/whatsapp/notificaciones';

const TURNO_INCLUDE = { vehiculo: { include: { cliente: true } }, servicio: true } as const;

function parseFecha(fecha: string): Date {
  // 'fecha' llega como 'YYYY-MM-DD' (sin hora) — se guarda como @db.Date.
  return new Date(`${fecha}T00:00:00.000Z`);
}

// Precio de lista del servicio, con el descuento de empresa del cliente
// dueño del vehículo aplicado si corresponde (ver Etapa 3e: Empresas).
// Se llama al crear/editar el turno y el resultado queda guardado en
// precioNeto — un cambio posterior de precio o de % de descuento no debe
// alterar turnos ya cargados.
export async function calcularPrecioNeto(vehiculoId: number, servicioId: number): Promise<number> {
  const [vehiculo, servicio] = await Promise.all([
    prisma.vehiculo.findUnique({ where: { id: vehiculoId }, include: { cliente: true } }),
    prisma.servicio.findUnique({ where: { id: servicioId } }),
  ]);
  if (!vehiculo) throw { status: 404, message: 'Vehículo no encontrado', code: 'NOT_FOUND' };
  if (!servicio) throw { status: 404, message: 'Servicio no encontrado', code: 'NOT_FOUND' };

  const descuentoPct = vehiculo.cliente.esEmpresa ? vehiculo.cliente.descuentoPct ?? 0 : 0;
  if (!descuentoPct) return servicio.precio;
  return Math.round(servicio.precio * (1 - descuentoPct / 100));
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
  vehiculoId: number;
  servicioId: number;
  formaPago: FormaPago;
  pagado?: boolean;
  facturar?: boolean;
}

export async function createTurno(data: CreateTurnoInput) {
  const precioNeto = await calcularPrecioNeto(data.vehiculoId, data.servicioId);
  return prisma.turno.create({
    data: {
      fecha: parseFecha(data.fecha),
      hora: data.hora,
      linea: data.linea,
      vehiculoId: data.vehiculoId,
      servicioId: data.servicioId,
      precioNeto,
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
  vehiculoId: number;
  servicioId: number;
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
  const precioNeto = await calcularPrecioNeto(data.vehiculoId, data.servicioId);
  return prisma.turno.update({ where: { id }, data: { ...data, precioNeto }, include: TURNO_INCLUDE });
}

export async function completarTurno(id: number) {
  const actual = await prisma.turno.findUnique({ where: { id } });
  if (!actual) throw { status: 404, message: 'Turno no encontrado', code: 'NOT_FOUND' };

  // El token de encuesta se genera una sola vez: si el turno se reabre y se
  // vuelve a completar, el link ya enviado por WhatsApp sigue sirviendo.
  const resenaToken = actual.resenaToken ?? generarResenaToken();
  const turno = await prisma.turno.update({
    where: { id },
    data: { estado: 'COMPLETADO', resenaToken },
    include: TURNO_INCLUDE,
  });

  if (!actual.resenaToken) {
    enviarEncuestaResena(turno.vehiculo.cliente.telefono, turno.vehiculo.cliente.denominacion, resenaToken);
  }

  return turno;
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
