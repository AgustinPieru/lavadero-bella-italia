// Grilla de turnos (cada 1:15, igual que la demo) para el selector manual de
// hora en Agenda y para los cupos de Horarios y Cupos (Etapa 3d).
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

// Grilla fina (cada 30') SOLO para los selectores "Desde/Hasta" de apertura
// en Horarios y Cupos — ahí conviene precisión de media hora para definir el
// horario de atención con exactitud (distinto de la grilla de turnos de arriba).
export function generateTimeOptions(desde: string, hasta: string, stepMin = 30): string[] {
  const out: string[] = [];
  let t = timeToMinutes(desde);
  const end = timeToMinutes(hasta);
  while (t <= end) {
    out.push(minutesToTime(t));
    t += stepMin;
  }
  return out;
}

export const TIME_OPTIONS = generateTimeOptions('06:00', '22:30');
