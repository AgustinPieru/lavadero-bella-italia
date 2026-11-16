import prisma from '../../lib/prisma';
import { redondear2 } from '../../lib/money';
import { IVA_TASA } from '../facturas/facturas.service';

export interface SaldoInicialInput {
  fecha: string;
  cuenta: number;
  efectivo: number;
}

function parseFecha(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

// Fila única (id fijo 1) — ver nota en schema.prisma sobre SaldoInicialCaja.
export async function getSaldoInicial() {
  return prisma.saldoInicialCaja.findUnique({ where: { id: 1 } });
}

export async function setSaldoInicial(input: SaldoInicialInput) {
  const data = { fecha: parseFecha(input.fecha), cuenta: input.cuenta, efectivo: input.efectivo };
  return prisma.saldoInicialCaja.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
}

// Saldo de caja ACTUAL (no por período, a diferencia de Reportes): saldo
// inicial + todo movimiento de plata real desde esa fecha. Turnos a
// CUENTA_CORRIENTE quedan afuera hasta que se cobran (ver marcarPagada en
// facturas.service.ts, que postea el haber acá con su medioPago). Gastos y
// cobros sin medioPago clasificado (todo lo cargado antes de esta etapa)
// tampoco mueven ninguno de los dos saldos — se devuelven aparte en
// `sinClasificar` para que no desaparezcan silenciosamente del reporte.
export async function getSaldoCaja() {
  const inicial = await getSaldoInicial();
  if (!inicial) {
    return { configurado: false as const, fechaDesde: null, cuenta: 0, efectivo: 0, total: 0, sinClasificar: 0 };
  }

  const [turnos, gastos, cobros] = await Promise.all([
    prisma.turno.findMany({
      where: { estado: 'COMPLETADO', fecha: { gte: inicial.fecha }, formaPago: { not: 'CUENTA_CORRIENTE' } },
      select: { precioNeto: true, formaPago: true, facturar: true },
    }),
    prisma.gasto.findMany({ where: { fecha: { gte: inicial.fecha } }, select: { monto: true, medioPago: true } }),
    prisma.movimientoCuentaCorriente.findMany({
      where: { fecha: { gte: inicial.fecha }, haber: { gt: 0 } },
      select: { haber: true, medioPago: true },
    }),
  ]);

  let cuenta = inicial.cuenta;
  let efectivo = inicial.efectivo;
  let sinClasificar = 0;

  // Lo que efectivamente entra en mano es precioNeto + IVA cuando el turno
  // se factura (misma fórmula que cerrarDiario en facturas.service.ts) —
  // Turno.precioNeto es siempre neto, nunca el total cobrado.
  turnos.forEach((t) => {
    const monto = t.facturar ? redondear2(t.precioNeto * (1 + IVA_TASA)) : t.precioNeto;
    if (t.formaPago === 'TRANSFERENCIA') cuenta += monto;
    else efectivo += monto; // CONTADO | EFECTIVO
  });

  gastos.forEach((g) => {
    if (g.medioPago === 'CUENTA') cuenta -= g.monto;
    else if (g.medioPago === 'EFECTIVO') efectivo -= g.monto;
    else sinClasificar += g.monto;
  });

  cobros.forEach((m) => {
    if (m.medioPago === 'CUENTA') cuenta += m.haber;
    else if (m.medioPago === 'EFECTIVO') efectivo += m.haber;
    else sinClasificar += m.haber;
  });

  return {
    configurado: true as const,
    fechaDesde: inicial.fecha.toISOString().slice(0, 10),
    cuenta: redondear2(cuenta),
    efectivo: redondear2(efectivo),
    total: redondear2(cuenta + efectivo),
    sinClasificar: redondear2(sinClasificar),
  };
}

export type SaldoCaja = Awaited<ReturnType<typeof getSaldoCaja>>;
