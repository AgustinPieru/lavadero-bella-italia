import prisma from '../../lib/prisma';
import * as wsfev1 from '../../lib/arca/wsfev1';
import { arcaConfig } from '../../lib/arca/config';
import { enviarDocumento } from '../../lib/whatsapp/client';
import { generarOrdenTrabajoPdfBuffer } from './ordenTrabajo.pdf';

const FACTURA_INCLUDE = {
  cliente: true,
  turnos: { include: { vehiculo: true, servicio: true } },
} as const;

function parseFecha(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

const IVA_TASA = 0.21;

// Se llama desde "Cerrar control diario" en la Agenda. Agrupa los turnos
// COMPLETADOs del día por cliente — si un cliente tuvo más de un vehículo
// ese día, se consolidan en UN solo comprobante, no uno por vehículo. Es
// idempotente: un turno que ya tiene facturaId no se vuelve a tomar, así
// que cerrar el mismo día dos veces no duplica nada.
//
// facturar=false ("se cobra pero no se emite comprobante") sigue el MISMO
// flujo — también genera su comprobante, para poder mandar la orden de
// trabajo igual que al resto — con dos excepciones: nunca lleva el 21% de
// IVA y nunca es de tipo ARCA (no corresponde emitirlo contra AFIP). Por
// eso un cliente con turnos facturados Y no facturados el mismo día termina
// en DOS comprobantes separados (no se puede mezclar IVA/no-IVA en un
// mismo total): se agrupa por cliente + facturar, no solo por cliente.
export async function cerrarDiario(fecha: string) {
  const fechaDate = parseFecha(fecha);

  const turnos = await prisma.turno.findMany({
    where: { fecha: fechaDate, estado: 'COMPLETADO', facturaId: null },
    include: { vehiculo: { include: { cliente: true } } },
  });

  const grupos = new Map<string, typeof turnos>();
  turnos.forEach((t) => {
    const key = `${t.vehiculo.clienteId}:${t.facturar}`;
    const list = grupos.get(key) ?? [];
    list.push(t);
    grupos.set(key, list);
  });

  let seq = (await prisma.factura.count({ where: { fecha: fechaDate } })) + 1;
  const nuevas = [];

  for (const turnosGrupo of grupos.values()) {
    const cliente = turnosGrupo[0].vehiculo.cliente;
    const facturar = turnosGrupo[0].facturar;
    const clienteId = cliente.id;
    const neto = turnosGrupo.reduce((a, t) => a + t.precioNeto, 0);
    const iva = facturar ? Math.round(neto * IVA_TASA) : 0;
    const total = neto + iva;
    const comprobante = facturar && cliente.esEmpresa && cliente.facturacion === 'ARCA' ? 'ARCA' : 'INTERNA';
    const estado = turnosGrupo[0].formaPago === 'CUENTA_CORRIENTE' ? 'PENDIENTE' : 'PAGADA';
    const numero = `F-${fecha.replace(/-/g, '')}-${seq++}`;

    const factura = await prisma.factura.create({
      data: { numero, fecha: fechaDate, clienteId, comprobante, facturar, neto, iva, total, formaPago: turnosGrupo[0].formaPago, estado },
    });
    await prisma.turno.updateMany({
      where: { id: { in: turnosGrupo.map((t) => t.id) } },
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

// La orden de trabajo es por cliente y día, no por comprobante: un cliente
// con turnos facturados y no facturados el mismo día tiene DOS Facturas
// (ver cerrarDiario, por el IVA) pero tiene que recibir UNA sola orden de
// trabajo con todos sus lavados juntos. Por eso se buscan todas las
// facturas de ese cliente para esa fecha y se consolidan sus turnos y
// montos, en vez de usar solo los de la factura por la que se entró.
// Se expone también la lista de esas facturas (no solo el total ya sumado)
// para que el frontend pueda mostrar el detalle contable de cada una
// (comprobante, estado, CAE) junto a la orden consolidada — ver
// FacturaDetailDialog, que ya no muestra una sola factura aislada.
export async function getOrdenTrabajoDelDia(facturaId: number) {
  const factura = await findOrThrow(facturaId);
  const facturasDelDia = await prisma.factura.findMany({
    where: { clienteId: factura.clienteId, fecha: factura.fecha },
    include: FACTURA_INCLUDE,
    orderBy: { id: 'asc' },
  });
  const turnos = facturasDelDia
    .flatMap((f) => f.turnos)
    .sort((a, b) => a.hora.localeCompare(b.hora));
  return {
    fecha: factura.fecha,
    cliente: factura.cliente,
    turnos,
    neto: facturasDelDia.reduce((a, f) => a + f.neto, 0),
    iva: facturasDelDia.reduce((a, f) => a + f.iva, 0),
    total: facturasDelDia.reduce((a, f) => a + f.total, 0),
    facturas: facturasDelDia,
  };
}

// Manual, a diferencia de las notificaciones de confirmación/encuesta: si
// WhatsApp no está configurado o el número no está registrado, el error se
// propaga tal cual (ver controller) para que quien lo pidió sepa que no salió.
export async function enviarOrdenTrabajo(id: number) {
  const factura = await findOrThrow(id);
  const orden = await getOrdenTrabajoDelDia(id);
  const buffer = await generarOrdenTrabajoPdfBuffer(orden);
  await enviarDocumento(
    factura.cliente.telefono,
    buffer,
    `orden-trabajo-${factura.fecha.toISOString().slice(0, 10)}.pdf`,
    'Te enviamos la orden de trabajo de *Lavadero Bella Italia* con el detalle de los trabajos realizados.'
  );
  return factura;
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
