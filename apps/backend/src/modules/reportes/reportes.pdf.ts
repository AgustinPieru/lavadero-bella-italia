import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { computeReporte, RangoInput } from './reportes.service';

const FORMA_PAGO_LABEL: Record<string, string> = {
  CONTADO: 'Contado',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  CUENTA_CORRIENTE: 'Cuenta corriente',
};
const CATEGORIA_LABEL: Record<string, string> = {
  SUELDOS: 'Sueldos',
  IMPUESTOS: 'Impuestos',
  SERVICIOS: 'Servicios',
  INSUMOS: 'Insumos',
  OTRO: 'Otro',
};

function pesos(n: number): string {
  return `$${n.toLocaleString('es-AR')}`;
}

function tabla(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], colWidths: number[]) {
  const startX = doc.x;
  let y = doc.y;
  doc.font('Helvetica-Bold').fontSize(10);
  headers.forEach((h, i) => {
    const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(h, x, y, { width: colWidths[i] });
  });
  y += 16;
  doc
    .moveTo(startX, y - 3)
    .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y - 3)
    .strokeColor('#dddddd')
    .stroke();
  doc.font('Helvetica').fontSize(10);
  if (rows.length === 0) {
    doc.fillColor('#999999').text('Sin datos en este período', startX, y);
    doc.fillColor('black');
    y += 18;
  } else {
    rows.forEach((row) => {
      row.forEach((cell, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(cell, x, y, { width: colWidths[i] });
      });
      y += 18;
    });
  }
  doc.y = y + 10;
}

export async function generarReportePdf(res: Response, rango: RangoInput): Promise<void> {
  const r = await computeReporte(rango);
  const ticketProm = r.completadosCount ? Math.round(r.ingresos / r.completadosCount) : 0;
  const totalVeh = r.camiones + r.autos;
  const pctCamion = totalVeh ? Math.round((r.camiones / totalVeh) * 100) : 0;
  const pctAuto = totalVeh ? 100 - pctCamion : 0;
  const tasaCancelacion = r.totalCount ? Math.round((r.canceladosCount / r.totalCount) * 100) : 0;
  const rangoLabel = rango.desde === rango.hasta ? `Datos del ${rango.desde}` : `Del ${rango.desde} al ${rango.hasta}`;

  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-${rango.desde}-a-${rango.hasta}.pdf"`);
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(18).text('Lavadero Bella Italia');
  doc.font('Helvetica').fontSize(11).fillColor('#555555').text('Reporte de contabilidad');
  doc.fontSize(9).text(`${rangoLabel} — generado el ${new Date().toLocaleDateString('es-AR')}`);
  doc.fillColor('black').moveDown(1);

  doc.font('Helvetica-Bold').fontSize(11);
  const resumen = [
    ['Ganancia neta', pesos(r.ingresos - r.gastosTotal)],
    ['Ingresos', pesos(r.ingresos)],
    ['Gastos', pesos(r.gastosTotal)],
    ['Ticket promedio', pesos(ticketProm)],
  ];
  resumen.forEach(([label, value]) => {
    doc.text(`${label}: `, { continued: true }).font('Helvetica').text(value).font('Helvetica-Bold');
  });
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(13).text('Vehículos');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Camiones: ${r.camiones} (${pctCamion}%)`);
  doc.text(`Autos: ${r.autos} (${pctAuto}%)`);
  doc.text(`Turnos totales / completados / cancelados: ${r.totalCount} / ${r.completadosCount} / ${r.canceladosCount} · ${tasaCancelacion}% cancelación`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(13).text('Forma de pago');
  doc.moveDown(0.3);
  tabla(
    doc,
    ['Forma de pago', 'Turnos', 'Monto'],
    Object.entries(r.porFormaPago)
      .sort((a, b) => b[1].monto - a[1].monto)
      .map(([fp, v]) => [FORMA_PAGO_LABEL[fp] ?? fp, String(v.cantidad), pesos(v.monto)]),
    [250, 100, 150]
  );

  doc.font('Helvetica-Bold').fontSize(13).text('Gastos por categoría');
  doc.moveDown(0.3);
  tabla(
    doc,
    ['Categoría', 'Monto'],
    Object.entries(r.gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, monto]) => [CATEGORIA_LABEL[cat] ?? cat, pesos(monto)]),
    [250, 150]
  );

  doc.font('Helvetica-Bold').fontSize(13).text('Top empresas');
  doc.moveDown(0.3);
  tabla(
    doc,
    ['Empresa', 'Lavados', 'Monto'],
    r.topEmpresas.map((e) => [e.nombre, String(e.lavados), pesos(e.monto)]),
    [250, 100, 150]
  );

  doc.fontSize(8).fillColor('#999999').text('Este reporte se generó automáticamente con los turnos y gastos cargados en el sistema para el período elegido.');

  doc.end();
}
