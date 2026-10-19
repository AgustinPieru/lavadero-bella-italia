// Mismo paso de 1:15 hs que usa el front (ver apps/frontend/src/lib/timeSlots.ts
// y el seed de Horarios) — se repite acá porque el cálculo de disponibilidad
// del turnero público tiene que hacerse en el servidor (no se le puede confiar
// al cliente qué slots están realmente libres).
export const SLOT_STEP_MIN = 75;

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

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

// 'CERRADO' bloquea el horario para cualquier vehículo (ej. un corte de
// mediodía); 'CAMION'/'AUTO' solo bloquean al tipo de vehículo contrario;
// 'LIBRE' no bloquea a nadie. Mismo criterio que demo.html (modoBloqueaVehiculo).
export function modoBloqueaVehiculo(modo: string, vehiculo: string): boolean {
  if (!modo || modo === 'LIBRE') return false;
  if (modo === 'CERRADO') return true;
  return modo !== vehiculo;
}
