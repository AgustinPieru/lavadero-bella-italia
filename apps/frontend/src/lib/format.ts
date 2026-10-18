export function formatPesos(value: number): string {
  return `$${value.toLocaleString('es-AR')}`;
}

const DOW_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 'Hoy · lunes 18 de octubre' / 'Ayer · ...' / 'Mañana · ...' / fecha completa
export function formatFechaAgenda(d: Date): string {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const cmp = new Date(d);
  cmp.setHours(0, 0, 0, 0);
  const diffDias = Math.round((cmp.getTime() - hoy.getTime()) / 86400000);
  const dowCap = DOW_LONG[d.getDay()].replace(/^./, (c) => c.toUpperCase());
  const base = `${dowCap} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  if (diffDias === 0) return `Hoy · ${base}`;
  if (diffDias === -1) return `Ayer · ${base}`;
  if (diffDias === 1) return `Mañana · ${base}`;
  return base;
}
