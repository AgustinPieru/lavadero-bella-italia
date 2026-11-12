// Importación histórica de cuentas corrientes desde el Excel del dueño
// ("CUENTAS CORRIENTES CLIENTES.xlsx", una pestaña por cliente con columnas
// FECHA/DESCRIPCION/DEBE/HABER/SALDO). Se corre UNA sola vez a mano:
//
//   npx ts-node scripts/importCuentaCorriente.ts "/ruta/al/archivo.xlsx"
//
// Es seguro reintentarlo: la idempotencia es "¿este cliente ya tiene algún
// movimiento?" (no "¿ya existe el cliente?"), así que si se cae a mitad de
// camino, un cliente ya creado pero sin movimientos se reprocesa completo,
// y uno ya completo se saltea.
//
// Crea los Cliente directo con prisma.cliente.create (no con
// createCliente() del service): ese validador exige teléfono no vacío y el
// Excel no tiene esa info — es a propósito, no "arreglarlo" para que pase
// por el service.
import '../src/config/env';
import * as path from 'path';
import * as XLSX from 'xlsx';
import prisma from '../src/lib/prisma';
import { redondear2 } from '../src/lib/money';

const IGNORAR = new Set(['Hoja3']);

interface Fila {
  fecha: Date | null;
  descripcion: string;
  debe: number;
  haber: number;
  saldoExcel: number;
  saldoCalculado: number;
}

function celda(ws: XLSX.WorkSheet, direccion: string) {
  return ws[direccion];
}

function textoCelda(ws: XLSX.WorkSheet, direccion: string): string {
  const c = celda(ws, direccion);
  if (!c || c.v === undefined || c.v === null) return '';
  return String(c.v).trim();
}

function numeroCelda(ws: XLSX.WorkSheet, direccion: string): number {
  const c = celda(ws, direccion);
  if (!c || c.v === undefined || c.v === null) return 0;
  if (typeof c.v === 'number') return c.v;
  if (typeof c.v === 'string') {
    const n = parseFloat(c.v.replace(',', '.').trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

// Celdas de fecha vienen como Date real (gracias a cellDates:true) salvo
// ~10 filas en todo el archivo que son un string " DD-MM-YY" mal tipeado.
function fechaCelda(ws: XLSX.WorkSheet, direccion: string): Date | null {
  const c = celda(ws, direccion);
  if (!c || c.v === undefined || c.v === null) return null;
  if (c.v instanceof Date) {
    return new Date(Date.UTC(c.v.getFullYear(), c.v.getMonth(), c.v.getDate()));
  }
  if (typeof c.v === 'string') {
    const m = /^\s*(\d{1,2})-(\d{1,2})-(\d{2})\s*$/.exec(c.v);
    if (m) {
      const [, d, mo, y] = m;
      return new Date(Date.UTC(2000 + Number(y), Number(mo) - 1, Number(d)));
    }
  }
  return null;
}

function parseCuit(headerF3: string): string | null {
  const m = /CUIT\.?\s*:?\s*([\d-]+)/i.exec(headerF3);
  return m ? m[1] : null;
}

// "ACERMA" (pestaña) vs "ACERMA S.A" (cliente ya cargado a mano en prod) son
// la misma empresa — se normaliza sacando puntuación y el sufijo societario
// antes de comparar, para no crear un cliente duplicado.
function normalizarDenominacion(s: string): string {
  return s
    .toUpperCase()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+(SA|SRL|SAS|SA DE CV)$/i, '')
    .trim();
}

// Todas las filas con DEBE dicen "FACTURA Nº 03-XX" (o "FACTURA 03-XX",
// sin el "Nº") — es una numeración única de toda la empresa, no por
// cliente, así que el número extraído ya es único por sí solo.
function extraerNumeroFactura(descripcion: string): string | null {
  const m = /FACTURA\s*(?:N[ºo°]?\.?)?\s*([0-9][0-9A-Za-z-]*)/i.exec(descripcion);
  return m ? m[1] : null;
}

interface ResumenHoja {
  clienteId: number;
  denominacion: string;
  movimientos: number;
}

async function main() {
  const rutaArg = process.argv[2];
  if (!rutaArg) {
    console.error('Uso: npx ts-node scripts/importCuentaCorriente.ts "<ruta-al-excel>"');
    process.exit(1);
  }
  const ruta = path.resolve(rutaArg);
  const wb = XLSX.readFile(ruta, { cellDates: true });

  const clientesExistentes = await prisma.cliente.findMany();

  const creados: string[] = [];
  const reutilizados: string[] = [];
  const salteados: string[] = [];
  const sinCuit: string[] = [];
  const abortadas: { hoja: string; motivo: string }[] = [];
  const procesadas: ResumenHoja[] = [];

  for (const sheetName of wb.SheetNames) {
    if (IGNORAR.has(sheetName)) continue;
    const ws = wb.Sheets[sheetName];
    const ref = ws['!ref'];
    if (!ref) continue;

    const denominacion = sheetName.trim();
    const range = XLSX.utils.decode_range(ref);

    // Filas reales desde la fila 7 (índice 6, 0-based) hasta el final del
    // rango usado por la hoja — se recorre todo, no se corta en la primera
    // fila vacía (hay huecos en medio de algunas hojas).
    const filas: Fila[] = [];
    for (let r = 6; r <= range.e.r; r++) {
      const fila = r + 1;
      const descripcion = textoCelda(ws, `B${fila}`);
      const debe = redondear2(numeroCelda(ws, `C${fila}`));
      const haber = redondear2(numeroCelda(ws, `D${fila}`));
      if (!descripcion && debe === 0 && haber === 0) continue;
      filas.push({
        fecha: fechaCelda(ws, `A${fila}`),
        descripcion: descripcion || '(sin descripción)',
        debe,
        haber,
        saldoExcel: redondear2(numeroCelda(ws, `E${fila}`)),
        saldoCalculado: 0,
      });
    }
    if (filas.length === 0) continue;

    // Fecha faltante → se hereda de la fila anterior de la misma hoja; si
    // la primera fila no tiene fecha y no hay de dónde heredar, se aborta.
    let fechaAnterior: Date | null = null;
    let sinFechaSinFallback = false;
    for (const f of filas) {
      if (!f.fecha) {
        if (!fechaAnterior) {
          sinFechaSinFallback = true;
          break;
        }
        f.fecha = fechaAnterior;
      } else {
        fechaAnterior = f.fecha;
      }
    }
    if (sinFechaSinFallback) {
      abortadas.push({ hoja: sheetName, motivo: 'primera fila sin fecha parseable y sin fila anterior de la cual heredarla' });
      continue;
    }

    // Chequeo de seguridad: recalcular el saldo acumulado fila por fila y
    // compararlo contra la columna SALDO del Excel. Si una sola fila no
    // cierra, se aborta TODA la hoja (no se importa parcial) — protege
    // contra que el archivo se haya editado desde que se analizó.
    let acc = 0;
    let desajuste: { fila: number; calculado: number; esperado: number } | null = null;
    filas.forEach((f, idx) => {
      acc = redondear2(acc + f.debe - f.haber);
      f.saldoCalculado = acc;
      if (!desajuste && Math.abs(acc - f.saldoExcel) > 0.01) {
        desajuste = { fila: idx + 1, calculado: acc, esperado: f.saldoExcel };
      }
    });
    if (desajuste) {
      const d = desajuste as { fila: number; calculado: number; esperado: number };
      abortadas.push({ hoja: sheetName, motivo: `el saldo no cierra en la fila ${d.fila} (calculado ${d.calculado}, esperado ${d.esperado})` });
      continue;
    }

    const cuit = parseCuit(textoCelda(ws, 'F3'));
    if (!cuit) sinCuit.push(denominacion);

    // Find-or-create cliente, normalizando nombre — en prod puede que
    // alguno de estos ya exista cargado a mano con mayúsculas/espacios/
    // sufijo societario distinto al de la pestaña (ej. "ACERMA" vs
    // "ACERMA S.A").
    let cliente = clientesExistentes.find((c) => normalizarDenominacion(c.denominacion) === normalizarDenominacion(denominacion));
    if (cliente) {
      reutilizados.push(`${denominacion} -> cliente existente #${cliente.id} "${cliente.denominacion}"`);
      // Si ya existía pero no tenía cuenta corriente habilitada, se activa
      // ese único campo — es justo lo que hace falta para que el chip de
      // saldo se vea en Facturación; no se toca nada más de sus datos
      // reales (esEmpresa, facturacion, etc. quedan como el dueño los puso).
      if (!cliente.cuentaCorrienteHabilitada) {
        cliente = await prisma.cliente.update({ where: { id: cliente.id }, data: { cuentaCorrienteHabilitada: true } });
      }
    } else {
      cliente = await prisma.cliente.create({
        data: {
          denominacion,
          telefono: '',
          cuit,
          esEmpresa: true,
          facturacion: 'INTERNA',
          cuentaCorrienteHabilitada: true,
        },
      });
      clientesExistentes.push(cliente);
      creados.push(denominacion);
    }

    const yaTieneMovimientos = (await prisma.movimientoCuentaCorriente.count({ where: { clienteId: cliente.id } })) > 0;
    if (yaTieneMovimientos) {
      salteados.push(denominacion);
      continue;
    }

    // Cada fila con DEBE es una factura vieja real — se crea como Factura
    // de verdad (no solo como movimiento del ledger) para que aparezca en
    // la lista de Facturación, que es donde el dueño mira quién debe. El
    // Excel es un libro de saldo corrido, no dice qué pago corresponde a
    // qué factura puntual — se infiere con el criterio contable estándar
    // "se cobra lo más viejo primero", pero respetando el ORDEN
    // CRONOLÓGICO real de la hoja (no "sumar todos los pagos del período y
    // aplicarlos de una"): se simula una cola FIFO de facturas abiertas —
    // cada pago se descuenta de la más vieja de la cola, la cierra
    // (PAGADA) si alcanza y sigue con el resto del pago sobre la
    // siguiente, o la deja parcialmente cubierta si no alcanza (ese pago
    // se complementa con uno posterior). Lo que quede en la cola al final
    // queda PENDIENTE. Así el total de PENDIENTE coincide con el saldo del
    // ledger en el caso normal — la única excepción es un cliente que
    // terminó con crédito a favor (saldo negativo, ej. ACERMA): ahí todas
    // sus facturas quedan PAGADA porque efectivamente las pagó todas, y el
    // crédito sobrante no tiene dónde reflejarse como factura (el saldo
    // del chip en Facturación sigue siendo el correcto, viene del ledger).
    const cola: { index: number; restante: number }[] = [];
    let credito = 0; // sobrante de un pago que superó toda la deuda abierta en ese momento — se guarda para cubrir la próxima factura, no se pierde.
    filas.forEach((f, index) => {
      const debeNeto = Math.max(0, redondear2(f.debe - f.haber));
      const haberNeto = Math.max(0, redondear2(f.haber - f.debe));

      // DEBE y HABER juntos en la misma fila (factura anulada/corregida el
      // mismo día) se netean entre sí primero — así el haber de esta fila
      // no paga por error una factura vieja ajena, y el debe no entra a la
      // cola si ya quedó cancelado por su propio haber.
      let pago = haberNeto;
      while (pago > 0.01 && cola.length > 0) {
        const frente = cola[0];
        if (frente.restante <= pago + 0.01) {
          pago = redondear2(pago - frente.restante);
          cola.shift();
        } else {
          frente.restante = redondear2(frente.restante - pago);
          pago = 0;
        }
      }
      if (pago > 0.01) credito = redondear2(credito + pago);

      if (debeNeto > 0.01) {
        let monto = debeNeto;
        if (credito > 0.01) {
          const usado = Math.min(credito, monto);
          credito = redondear2(credito - usado);
          monto = redondear2(monto - usado);
        }
        if (monto > 0.01) {
          cola.push({ index, restante: monto });
        }
      }
    });
    // Lo que queda en la cola al final es lo realmente impago de cada
    // factura — puede ser el monto completo (nunca se tocó) o solo una
    // parte (quedó parcialmente cubierta por un pago que no alcanzó para
    // cerrarla del todo). Todo índice que no aparece acá se pagó entero.
    const restanteFinalPorIndex = new Map<number, number>();
    cola.forEach((c) => restanteFinalPorIndex.set(c.index, c.restante));

    const numerosUsados = new Set<string>();
    let sinNumeroSeq = 0;

    for (let index = 0; index < filas.length; index++) {
      const f = filas[index];
      let facturaId: number | null = null;

      if (f.debe > 0) {
        const restante = redondear2(restanteFinalPorIndex.get(index) ?? 0);
        const pagado = redondear2(f.debe - restante);

        let numero = extraerNumeroFactura(f.descripcion);
        if (!numero || numerosUsados.has(numero)) {
          numero = `${denominacion}-${++sinNumeroSeq}`;
        }
        numerosUsados.add(numero);

        const base = {
          fecha: f.fecha!,
          clienteId: cliente.id,
          comprobante: 'INTERNA' as const,
          facturar: true,
          formaPago: 'CUENTA_CORRIENTE' as const,
        };

        if (restante <= 0.01 || pagado <= 0.01) {
          // Caso normal: la factura quedó entera pagada, o entera pendiente.
          const factura = await prisma.factura.create({
            data: { ...base, numero: `HIST-${numero}`, neto: f.debe, iva: 0, total: f.debe, estado: restante <= 0.01 ? 'PAGADA' : 'PENDIENTE' },
          });
          facturaId = factura.id;
        } else {
          // Quedó parcialmente cobrada: se parte en dos para que el total
          // pendiente sea el real, no el monto completo de la factura vieja.
          await prisma.factura.create({
            data: { ...base, numero: `HIST-${numero}-PAGADO`, neto: pagado, iva: 0, total: pagado, estado: 'PAGADA' },
          });
          const pendiente = await prisma.factura.create({
            data: { ...base, numero: `HIST-${numero}-SALDO`, neto: restante, iva: 0, total: restante, estado: 'PENDIENTE' },
          });
          facturaId = pendiente.id;
        }
      }

      await prisma.movimientoCuentaCorriente.create({
        data: {
          clienteId: cliente.id,
          fecha: f.fecha!,
          descripcion: f.descripcion,
          debe: f.debe,
          haber: f.haber,
          saldo: f.saldoCalculado,
          facturaId,
        },
      });
    }
    procesadas.push({ clienteId: cliente.id, denominacion, movimientos: filas.length });
  }

  console.log('\n=== Resumen de importación de cuentas corrientes ===');
  console.log(`Clientes creados (${creados.length}):`, creados);
  console.log(`Clientes existentes reutilizados (${reutilizados.length}):`, reutilizados);
  console.log(`Clientes salteados, ya tenían movimientos (${salteados.length}):`, salteados);
  console.log(`Sin CUIT parseable en el header (${sinCuit.length}):`, sinCuit);
  console.log('\nMovimientos creados por cliente:');
  procesadas.forEach((p) => console.log(`  - ${p.denominacion} (cliente #${p.clienteId}): ${p.movimientos} movimientos`));
  if (abortadas.length) {
    console.log(`\n⚠ Hojas ABORTADAS, revisar a mano (${abortadas.length}):`);
    abortadas.forEach((a) => console.log(`  - ${a.hoja}: ${a.motivo}`));
  } else {
    console.log('\nNinguna hoja abortada.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
