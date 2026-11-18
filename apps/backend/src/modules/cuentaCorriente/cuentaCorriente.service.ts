import prisma from '../../lib/prisma';
import { MedioPago } from '@prisma/client';
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
  medioPago?: MedioPago;
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
        medioPago: params.medioPago,
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

// Total que te deben entre todos los clientes: el último saldo (por id, no
// por fecha — ver nota en schema.prisma) de cada cliente, solo el que es a
// favor del lavadero (GREATEST con 0) — un cliente con crédito a favor
// (saldo negativo, ej. ACERMA) no resta del total pendiente, es un caso
// aparte, no "menos deuda de los demás".
export async function getSaldoTotalPendiente(): Promise<number> {
  const rows = await prisma.$queryRaw<{ total: number | null }[]>`
    SELECT COALESCE(SUM(GREATEST(saldo, 0)), 0)::float AS total
    FROM (
      SELECT DISTINCT ON (cliente_id) saldo
      FROM movimientos_cuenta_corriente
      ORDER BY cliente_id, id DESC
    ) ultimos
  `;
  return redondear2(rows[0]?.total ?? 0);
}
