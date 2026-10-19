import prisma from '../../lib/prisma';

export interface RangoInput {
  desde: string;
  hasta: string;
}

function parseFecha(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

function diasEnRango(desde: Date, hasta: Date): Date[] {
  const out: Date[] = [];
  const d = new Date(desde);
  while (d <= hasta) {
    out.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// Agrega turnos y gastos del rango elegido — las mismas fuentes que usan
// Agenda y Gastos, así que el reporte siempre es consistente con lo cargado
// ahí (sin planillas ni cálculos aparte).
export async function computeReporte({ desde, hasta }: RangoInput) {
  const desdeDate = parseFecha(desde);
  const hastaDate = parseFecha(hasta);

  const [turnos, gastos] = await Promise.all([
    prisma.turno.findMany({
      where: { fecha: { gte: desdeDate, lte: hastaDate } },
      include: { vehiculo: { include: { cliente: true } } },
    }),
    prisma.gasto.findMany({ where: { fecha: { gte: desdeDate, lte: hastaDate } } }),
  ]);

  const completados = turnos.filter((t) => t.estado === 'COMPLETADO');
  const cancelados = turnos.filter((t) => t.estado === 'CANCELADO');
  const noCancelados = turnos.filter((t) => t.estado !== 'CANCELADO');
  const ingresos = completados.reduce((a, t) => a + t.precioNeto, 0);
  const gastosTotal = gastos.reduce((a, g) => a + g.monto, 0);

  const gastosPorCategoria: Record<string, number> = {};
  gastos.forEach((g) => {
    gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] ?? 0) + g.monto;
  });

  const porFormaPago: Record<string, { cantidad: number; monto: number }> = {};
  completados.forEach((t) => {
    if (!porFormaPago[t.formaPago]) porFormaPago[t.formaPago] = { cantidad: 0, monto: 0 };
    porFormaPago[t.formaPago].cantidad++;
    porFormaPago[t.formaPago].monto += t.precioNeto;
  });

  const porEmpresa: Record<string, { lavados: number; monto: number }> = {};
  completados.forEach((t) => {
    if (!t.vehiculo.cliente.esEmpresa) return;
    const nombre = t.vehiculo.cliente.denominacion;
    if (!porEmpresa[nombre]) porEmpresa[nombre] = { lavados: 0, monto: 0 };
    porEmpresa[nombre].lavados++;
    porEmpresa[nombre].monto += t.precioNeto;
  });
  const topEmpresas = Object.entries(porEmpresa)
    .map(([nombre, v]) => ({ nombre, ...v }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5);

  const camiones = noCancelados.filter((t) => t.vehiculo.tipo === 'CAMION').length;
  const autos = noCancelados.filter((t) => t.vehiculo.tipo === 'AUTO').length;

  const lavadosPorDia = diasEnRango(desdeDate, hastaDate).map((d) => {
    const iso = d.toISOString().slice(0, 10);
    const cantidad = completados.filter((t) => t.fecha.toISOString().slice(0, 10) === iso).length;
    return { label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, cantidad };
  });

  return {
    lavadosPorDia,
    ingresos,
    gastosTotal,
    gastosPorCategoria,
    porFormaPago,
    topEmpresas,
    camiones,
    autos,
    totalCount: turnos.length,
    completadosCount: completados.length,
    canceladosCount: cancelados.length,
  };
}

export type Reporte = Awaited<ReturnType<typeof computeReporte>>;
