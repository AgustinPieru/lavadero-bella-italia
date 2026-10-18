import prisma from '../../lib/prisma';
import { VehiculoTipo } from '@prisma/client';

export interface CreateClienteInput {
  denominacion: string;
  telefono: string;
  cuit?: string;
  email?: string;
  direccion?: string;
  vehiculo: VehiculoTipo;
  subtipo: string;
  marca?: string;
  modelo?: string;
  patente?: string;
}

// Etapa 3a: solo lo que la Agenda necesita (listar para el selector del
// turno, alta rápida). Búsqueda/filtros/edición/baja completos llegan con
// el ABM dedicado en la Etapa 3b.
export async function getClientes() {
  return prisma.cliente.findMany({ orderBy: { denominacion: 'asc' } });
}

export async function createCliente(data: CreateClienteInput) {
  return prisma.cliente.create({ data });
}
