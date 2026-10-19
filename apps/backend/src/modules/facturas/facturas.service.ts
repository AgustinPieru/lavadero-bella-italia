import prisma from '../../lib/prisma';
import * as wsfev1 from '../../lib/arca/wsfev1';
import { arcaConfig } from '../../lib/arca/config';

const FACTURA_INCLUDE = {
  cliente: true,
  turnos: { include: { vehiculo: true, servicio: true } },
} as const;

function parseFecha(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

const IVA_TASA = 0.21;

// Se llama desde "Cerrar control diario" en la Agenda. Agrupa los turnos
// COMPLETADOs del día con facturar=true por cliente — si un cliente tuvo
// más de un vehículo ese día, se consolidan en UN solo comprobante, no uno
// por vehículo. Es idempotente: un turno que ya tiene facturaId no se
// vuelve a tomar, así que cerrar el mismo día dos veces no duplica nada.
export async function cerrarDiario(fecha: string) {
  const fechaDate = parseFecha(fecha);

  const turnos = await prisma.turno.findMany({
    where: { fecha: fechaDate, estado: 'COMPLETADO', facturar: true, facturaId: null },
    include: { vehiculo: { include: { cliente: true } } },
  });

  const grupos = new Map<number, typeof turnos>();
  turnos.forEach((t) => {
    const list = grupos.get(t.vehiculo.clienteId) ?? [];
    list.push(t);
    grupos.set(t.vehiculo.clienteId, list);
  });

  let seq = (await prisma.factura.count({ where: { fecha: fechaDate } })) + 1;
  const nuevas = [];

  for (const [clienteId, turnosCliente] of grupos) {
    const cliente = turnosCliente[0].vehiculo.cliente;
    const neto = turnosCliente.reduce((a, t) => a + t.precioNeto, 0);
    const iva = Math.round(neto * IVA_TASA);
    const total = neto + iva;
    const comprobante = cliente.esEmpresa && cliente.facturacion === 'ARCA' ? 'ARCA' : 'INTERNA';
    const estado = turnosCliente[0].formaPago === 'CUENTA_CORRIENTE' ? 'PENDIENTE' : 'PAGADA';
    const numero = `F-${fecha.replace(/-/g, '')}-${seq++}`;

    const factura = await prisma.factura.create({
      data: { numero, fecha: fechaDate, clienteId, comprobante, neto, iva, total, formaPago: turnosCliente[0].formaPago, estado },
    });
    await prisma.turno.updateMany({
      where: { id: { in: turnosCliente.map((t) => t.id) } },
      data: { facturaId: factura.id },
    });
    nuevas.push(await prisma.factura.findUniqueOrThrow({ where: { id: factura.id }, include: FACTURA_INCLUDE }));
  }

  return nuevas;
}

export async function getFacturas(filters: { fecha?: string; clienteId?: number } = {}) {
  return prisma.factura.findMany({
    where: {
      ...(filters.fecha ? { fecha: parseFecha(filters.fecha) } : {}),
      ...(filters.clienteId ? { clienteId: filters.clienteId } : {}),
    },
    include: FACTURA_INCLUDE,
    orderBy: { id: 'desc' },
  });
}

async function findOrThrow(id: number) {
  const factura = await prisma.factura.findUnique({ where: { id }, include: FACTURA_INCLUDE });
  if (!factura) {
    throw { status: 404, message: 'Factura no encontrada', code: 'NOT_FOUND' };
  }
  return factura;
}

export async function getFactura(id: number) {
  return findOrThrow(id);
}

// Cuenta corriente: marca una factura pendiente como cobrada.
export async function marcarPagada(id: number) {
  await findOrThrow(id);
  return prisma.factura.update({ where: { id }, data: { estado: 'PAGADA' }, include: FACTURA_INCLUDE });
}

export async function saldoPendientePorCliente(clienteId: number) {
  const pendientes = await prisma.factura.findMany({ where: { clienteId, estado: 'PENDIENTE' } });
  return pendientes.reduce((a, f) => a + f.total, 0);
}

// Pide el CAE real contra ARCA para una factura tipo ARCA. Mientras no haya
// certificado configurado (ver arca/config.ts), esto corta con
// ARCA_NO_CONFIGURADO — a propósito, no hay fallback silencioso.
export async function emitirEnArca(id: number) {
  const factura = await findOrThrow(id);
  if (factura.comprobante !== 'ARCA') {
    throw { status: 400, message: 'Esta factura no es de tipo ARCA', code: 'NO_ES_ARCA' };
  }
  if (factura.cae) {
    throw { status: 400, message: 'Esta factura ya tiene CAE asignado', code: 'YA_EMITIDA' };
  }

  const docNro = factura.cliente.cuit?.replace(/-/g, '') || '0';
  const result = await wsfev1.solicitarCae({
    cbteTipo: wsfev1.CBTE_TIPO.FACTURA_A,
    docTipo: factura.cliente.cuit ? wsfev1.DOC_TIPO.CUIT : wsfev1.DOC_TIPO.CONSUMIDOR_FINAL,
    docNro,
    impNeto: factura.neto,
    impIVA: factura.iva,
    impTotal: factura.total,
  });

  if (result.resultado !== 'A' || !result.cae) {
    throw {
      status: 502,
      message: `ARCA rechazó el comprobante: ${result.errores.map((e) => e.msg).join('; ') || 'sin detalle'}`,
      code: 'ARCA_RECHAZADO',
    };
  }

  return prisma.factura.update({
    where: { id },
    data: {
      cae: result.cae,
      caeFchVto: result.caeFchVto ? new Date(result.caeFchVto) : null,
      puntoVenta: arcaConfig.puntoVenta,
      numeroArca: result.cbteNro,
    },
    include: FACTURA_INCLUDE,
  });
}
