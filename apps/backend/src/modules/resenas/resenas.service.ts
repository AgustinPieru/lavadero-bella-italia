import prisma from '../../lib/prisma';
import { EstadoResena } from '@prisma/client';

const RESENA_INCLUDE = { turno: { include: { vehiculo: { include: { cliente: true } }, servicio: true } } } as const;

export async function getResenas(filters: { estado?: EstadoResena } = {}) {
  return prisma.resena.findMany({
    where: filters.estado ? { estado: filters.estado } : undefined,
    include: RESENA_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

// Para el turnero público (Etapa 4): solo lo aprobado, nunca ligado a datos
// de contacto del cliente.
export async function getResenasAprobadas() {
  return prisma.resena.findMany({
    where: { estado: 'APROBADA' },
    select: { id: true, puntaje: true, comentario: true, createdAt: true, turno: { select: { vehiculo: { select: { tipo: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function findOrThrow(id: number) {
  const resena = await prisma.resena.findUnique({ where: { id } });
  if (!resena) throw { status: 404, message: 'Reseña no encontrada', code: 'NOT_FOUND' };
  return resena;
}

export async function aprobarResena(id: number) {
  await findOrThrow(id);
  return prisma.resena.update({ where: { id }, data: { estado: 'APROBADA' }, include: RESENA_INCLUDE });
}

export async function ocultarResena(id: number) {
  await findOrThrow(id);
  return prisma.resena.update({ where: { id }, data: { estado: 'OCULTA' }, include: RESENA_INCLUDE });
}

// ── Encuesta pública (sin login), identificada por el token de Turno ──

export async function getEncuestaPorToken(token: string) {
  const turno = await prisma.turno.findUnique({
    where: { resenaToken: token },
    include: { vehiculo: { include: { cliente: true } }, servicio: true, resena: true },
  });
  if (!turno) throw { status: 404, message: 'Encuesta no encontrada', code: 'NOT_FOUND' };
  return turno;
}

export async function responderEncuesta(token: string, puntaje: number, comentario?: string) {
  const turno = await getEncuestaPorToken(token);
  if (turno.resena) throw { status: 409, message: 'Esta encuesta ya fue respondida', code: 'YA_RESPONDIDA' };

  return prisma.resena.create({
    data: { turnoId: turno.id, puntaje, comentario },
    include: RESENA_INCLUDE,
  });
}
