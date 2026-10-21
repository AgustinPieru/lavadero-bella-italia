import prisma from '../../lib/prisma';
import { VehiculoTipo, FormaPago } from '@prisma/client';
import { generateSlots, modoBloqueaVehiculo } from '../../lib/slots';
import { calcularPrecioNeto } from '../turnos/turnos.service';
import { enviarConfirmacionTurno } from '../../lib/whatsapp/notificaciones';

function parseFecha(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

// Para el selector "Empresa asociada" del paso 3 (solo camiones) — nunca se
// expone nada más que id + nombre, ningún dato de contacto/facturación.
export async function getEmpresasPublicas() {
  return prisma.cliente.findMany({
    where: { esEmpresa: true, activo: true },
    select: { id: true, denominacion: true },
    orderBy: { denominacion: 'asc' },
  });
}

export interface SlotDisponible {
  hora: string;
  linea: 'A' | 'B';
  disponible: boolean;
}

// Combina línea A y B de forma transparente: el cliente ve un solo horario
// disponible/ocupado por hora, sin saber de qué línea sale (igual que en la
// demo). Nunca expone los turnos reales de otra persona, solo si ese hueco
// está libre para el tipo de vehículo pedido.
export async function getDisponibilidad(fecha: string, vehiculo: VehiculoTipo): Promise<{ abierto: boolean; slots: SlotDisponible[] }> {
  const fechaDate = parseFecha(fecha);
  const diaSemana = fechaDate.getUTCDay();

  const horario = await prisma.horarioDia.findUnique({ where: { diaSemana } });
  if (!horario || !horario.abierto) return { abierto: false, slots: [] };

  const horasA = generateSlots(horario.desde, horario.hasta);
  const horasB = horario.lineaBHabilitada && horario.lineaBDesde && horario.lineaBHasta ? generateSlots(horario.lineaBDesde, horario.lineaBHasta) : [];
  const todasLasHoras = Array.from(new Set([...horasA, ...horasB])).sort();

  const modosA = (horario.modos as Record<string, string>) ?? {};
  const modosB = (horario.modosLineaB as Record<string, string> | null) ?? {};

  const turnosDelDia = await prisma.turno.findMany({
    where: { fecha: fechaDate, estado: { not: 'CANCELADO' } },
    select: { hora: true, linea: true },
  });
  const ocupado = new Set(turnosDelDia.map((t) => `${t.linea}:${t.hora}`));

  const slots: SlotDisponible[] = todasLasHoras.map((hora) => {
    const enA = horasA.includes(hora);
    const disponibleA = enA && !ocupado.has(`A:${hora}`) && !modoBloqueaVehiculo(modosA[hora] ?? 'LIBRE', vehiculo);

    const enB = horasB.includes(hora);
    const disponibleB = enB && !ocupado.has(`B:${hora}`) && !modoBloqueaVehiculo(modosB[hora] ?? 'LIBRE', vehiculo);

    return { hora, linea: disponibleA ? 'A' : 'B', disponible: disponibleA || disponibleB };
  });

  return { abierto: true, slots };
}

export interface ReservarTurnoInput {
  vehiculoTipo: VehiculoTipo;
  subtipo: string;
  servicioId: number;
  fecha: string;
  hora: string;
  denominacion: string;
  telefono: string;
  cuit?: string;
  marca?: string;
  modelo?: string;
  patente: string;
  empresaId?: number;
  formaPago: FormaPago;
}

const TURNO_INCLUDE = { vehiculo: { include: { cliente: true } }, servicio: true } as const;

export async function reservarTurno(input: ReservarTurnoInput) {
  const servicio = await prisma.servicio.findUnique({ where: { id: input.servicioId } });
  if (!servicio || !servicio.activo) throw { status: 404, message: 'Servicio no encontrado', code: 'NOT_FOUND' };
  if (servicio.vehiculo !== input.vehiculoTipo) {
    throw { status: 422, message: 'El servicio no corresponde al tipo de vehículo', code: 'VALIDATION_ERROR' };
  }

  // El slot se revalida en el servidor justo antes de reservar — lo que vio
  // el cliente en pantalla pudo haber quedado ocupado mientras completaba el
  // formulario.
  const disponibilidad = await getDisponibilidad(input.fecha, input.vehiculoTipo);
  const slot = disponibilidad.slots.find((s) => s.hora === input.hora);
  if (!disponibilidad.abierto || !slot || !slot.disponible) {
    throw { status: 409, message: 'Ese horario ya no está disponible, elegí otro', code: 'SLOT_OCUPADO' };
  }

  // Empresa asociada: el turno queda bajo la cuenta de la empresa (para que
  // aplique su descuento, cuenta corriente y factura consolidada) en vez de
  // crear un cliente particular con los datos tipeados por quien reserva.
  let clienteId: number;
  if (input.empresaId) {
    const empresa = await prisma.cliente.findUnique({ where: { id: input.empresaId } });
    if (!empresa || !empresa.esEmpresa) throw { status: 404, message: 'Empresa no encontrada', code: 'NOT_FOUND' };
    clienteId = empresa.id;
  } else {
    const existente = await prisma.cliente.findFirst({ where: { telefono: input.telefono } });
    if (existente) {
      // El teléfono ya identifica a este cliente — se actualizan sus datos
      // con lo que acaba de tipear (nombre/CUIT pueden haber cambiado desde
      // la última vez), en vez de dejar pisados los valores viejos.
      clienteId = (
        await prisma.cliente.update({
          where: { id: existente.id },
          data: { denominacion: input.denominacion, cuit: input.cuit },
        })
      ).id;
    } else {
      clienteId = (
        await prisma.cliente.create({
          data: { denominacion: input.denominacion, telefono: input.telefono, cuit: input.cuit },
        })
      ).id;
    }
  }

  const patenteNormalizada = input.patente.trim().toUpperCase();
  const vehiculoExistente = await prisma.vehiculo.findFirst({
    where: { clienteId, patente: patenteNormalizada },
  });
  const vehiculo = vehiculoExistente
    ? await prisma.vehiculo.update({
        where: { id: vehiculoExistente.id },
        data: { subtipo: input.subtipo, marca: input.marca, modelo: input.modelo },
      })
    : await prisma.vehiculo.create({
        data: {
          clienteId,
          tipo: input.vehiculoTipo,
          subtipo: input.subtipo,
          marca: input.marca,
          modelo: input.modelo,
          patente: patenteNormalizada,
        },
      });

  const precioNeto = await calcularPrecioNeto(vehiculo.id, servicio.id);

  const turno = await prisma.turno.create({
    data: {
      fecha: parseFecha(input.fecha),
      hora: input.hora,
      linea: slot.linea,
      vehiculoId: vehiculo.id,
      servicioId: servicio.id,
      precioNeto,
      formaPago: input.formaPago,
    },
    include: TURNO_INCLUDE,
  });

  enviarConfirmacionTurno(turno.vehiculo.cliente.telefono, turno.vehiculo.cliente.denominacion, {
    fecha: input.fecha,
    hora: turno.hora,
    servicioNombre: turno.servicio.nombre,
    precioNeto: turno.precioNeto,
  });

  return turno;
}
