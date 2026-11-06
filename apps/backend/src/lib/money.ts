// Evita el drift de punto flotante al operar con pesos con centavos
// (ej. 0.1 + 0.2 !== 0.3): todo cálculo de dinero redondea a 2 decimales
// antes de guardarse o sumarse.
export function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}
