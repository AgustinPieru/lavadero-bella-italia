import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export interface HorarioDiaInput {
  abierto: boolean;
  desde: string;
  hasta: string;
  modos: Record<string, string>;
  lineaBHabilitada: boolean;
  lineaBDesde: string;
  lineaBHasta: string;
  modosLineaB: Record<string, string>;
}

// Siempre hay 7 filas (una por día de la semana) — no es un recurso que se
// cree o borre, solo se lee y edita como bloque completo.
export async function getHorarios() {
  return prisma.horarioDia.findMany({ orderBy: { diaSemana: 'asc' } });
}

export async function getHorarioDia(diaSemana: number) {
  const horario = await prisma.horarioDia.findUnique({ where: { diaSemana } });
  if (!horario) {
    throw { status: 404, message: 'Día no encontrado', code: 'NOT_FOUND' };
  }
  return horario;
}

export async function updateHorarioDia(diaSemana: number, data: HorarioDiaInput) {
  await getHorarioDia(diaSemana);
  return prisma.horarioDia.update({
    where: { diaSemana },
    data: { ...data, modos: data.modos as Prisma.InputJsonValue, modosLineaB: data.modosLineaB as Prisma.InputJsonValue },
  });
}
