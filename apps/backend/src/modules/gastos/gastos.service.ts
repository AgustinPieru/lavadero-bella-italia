import prisma from '../../lib/prisma';
import { CategoriaGasto } from '@prisma/client';

export interface GastoInput {
  fecha: string;
  categoria: CategoriaGasto;
  monto: number;
  descripcion?: string;
}

function parseFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00.000Z`);
}

export async function getGastosDelDia(fecha: string) {
  return prisma.gasto.findMany({
    where: { fecha: parseFecha(fecha) },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createGasto(input: GastoInput) {
  return prisma.gasto.create({
    data: {
      fecha: parseFecha(input.fecha),
      categoria: input.categoria,
      monto: input.monto,
      descripcion: input.descripcion,
    },
  });
}

export async function deleteGasto(id: number) {
  return prisma.gasto.delete({ where: { id } });
}
