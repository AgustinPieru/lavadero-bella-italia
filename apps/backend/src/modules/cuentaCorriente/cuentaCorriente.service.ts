import prisma from '../../lib/prisma';
import { redondear2 } from '../../lib/money';

// Posteo atómico: lee el último saldo del cliente y escribe el movimiento
// nuevo derivado de esa lectura, todo en una transacción — dos llamadas
// concurrentes para el mismo cliente (dos cierres de diario, o un cobro
// cruzando con un cierre) podrían leer el mismo saldo viejo y pisarse si no
// fuera atómico.
export async function registrarMovimiento(params: {
  clienteId: number;
  fecha: Date;
  descripcion: string;
  debe?: number;
  haber?: number;
  facturaId?: number;
}) {
  return prisma.$transaction(async (tx) => {
    const ultimo = await tx.movimientoCuentaCorriente.findFirst({
      where: { clienteId: params.clienteId },
      orderBy: { id: 'desc' },
    });
    const saldoAnterior = ultimo?.saldo ?? 0;
    const debe = redondear2(params.debe ?? 0);
    const haber = redondear2(params.haber ?? 0);
    const saldo = redondear2(saldoAnterior + debe - haber);
    return tx.movimientoCuentaCorriente.create({
      data: {
        clienteId: params.clienteId,
        fecha: params.fecha,
        descripcion: params.descripcion,
        debe,
        haber,
        saldo,
        facturaId: params.facturaId,
      },
    });
  });
}

export async function getSaldoPorCliente(clienteId: number) {
  const ultimo = await prisma.movimientoCuentaCorriente.findFirst({
    where: { clienteId },
    orderBy: { id: 'desc' },
  });
  return ultimo?.saldo ?? 0;
}
