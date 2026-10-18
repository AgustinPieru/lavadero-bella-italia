// Grilla de horarios para el selector manual de turno. Fija por ahora
// (06:00 a 21:00, cada 1:15 — igual que la demo); se vuelve configurable
// por día de la semana cuando construyamos Horarios y Cupos (Etapa 3d).
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export const SLOT_STEP_MIN = 75;

export function generateSlots(desde: string, hasta: string): string[] {
  const out: string[] = [];
  let t = timeToMinutes(desde);
  const end = timeToMinutes(hasta);
  while (t < end) {
    out.push(minutesToTime(t));
    t += SLOT_STEP_MIN;
  }
  return out;
}

export const HORAS_AGENDA = generateSlots('06:00', '21:00');
