import PDFDocument from 'pdfkit';
import { Response } from 'express';

// Todos los lavados de un cliente en un día, consolidados sin importar de
// cuántas Facturas vinieran (ver facturas.service.ts#getOrdenTrabajo) — por
// eso no hay un "numero" de comprobante único acá.
interface OrdenTrabajo {
  fecha: Date;
  neto: number;
  iva: number;
  total: number;
  cliente: { denominacion: string; cuit: string | null };
  turnos: {
    hora: string;
    precioNeto: number;
    vehiculo: { tipo: string; subtipo: string; patente: string | null };
    servicio: { nombre: string };
  }[];
}

function pesos(n: number): string {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escribirContenido(doc: PDFKit.PDFDocument, orden: OrdenTrabajo): void {
  doc.font('Helvetica-Bold').fontSize(18).text('Lavadero Bella Italia');
  doc.font('Helvetica').fontSize(11).fillColor('#555555').text('Orden de trabajo');
  doc.fontSize(9).text(orden.fecha.toLocaleDateString('es-AR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }));
  doc.fillColor('black').moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text(orden.cliente.denominacion);
  if (orden.cliente.cuit) {
    doc.font('Helvetica').fontSize(10).fillColor('#555555').text(`CUIT ${orden.cliente.cuit}`);
  }
  doc.fillColor('black').moveDown(1);

  doc.font('Helvetica-Bold').fontSize(13).text('Trabajos realizados');
  doc.moveDown(0.3);

  const startX = doc.x;
  let y = doc.y;
  const colWidths = [60, 180, 180, 90];
  const headers = ['Hora', 'Vehículo', 'Servicio', 'Neto'];
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
  orden.turnos.forEach((t) => {
    const vehiculo = `${t.vehiculo.tipo === 'CAMION' ? 'Camión' : 'Auto'} · ${t.vehiculo.subtipo}${t.vehiculo.patente ? ` · ${t.vehiculo.patente}` : ''}`;
    const row = [t.hora, vehiculo, t.servicio.nombre, pesos(t.precioNeto)];
    row.forEach((cell, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(cell, x, y, { width: colWidths[i] });
    });
    y += 18;
  });
  doc.y = y + 14;

  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(`Neto: `, { continued: true }).font('Helvetica').text(pesos(orden.neto));
  if (orden.iva > 0) {
    doc.font('Helvetica-Bold').text(`IVA: `, { continued: true }).font('Helvetica').text(pesos(orden.iva));
  }
  doc.font('Helvetica-Bold').text(`Total: `, { continued: true }).font('Helvetica').text(pesos(orden.total));

  doc.moveDown(1.5);
  doc.fontSize(8).fillColor('#999999').text('Documento generado automáticamente por el sistema de gestión de Lavadero Bella Italia.');
}

export function generarOrdenTrabajoPdf(res: Response, orden: OrdenTrabajo): void {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="orden-trabajo-${orden.fecha.toISOString().slice(0, 10)}.pdf"`);
  doc.pipe(res);
  escribirContenido(doc, orden);
  doc.end();
}

export function generarOrdenTrabajoPdfBuffer(orden: OrdenTrabajo): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 45, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    escribirContenido(doc, orden);
    doc.end();
  });
}
