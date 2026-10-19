// Las rutas de cada módulo se agregan acá a medida que avanzamos de etapa
// (Etapa 3g: Gastos, 3h: Reseñas, 3i: Reportes). La Agenda es la pantalla de
// inicio del admin, igual que en la demo ("Agenda de hoy" era la sección
// por defecto).
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  CLIENTES: '/clientes',
  SERVICIOS: '/servicios',
  HORARIOS: '/horarios',
  EMPRESAS: '/empresas',
  FACTURACION: '/facturacion',
  GASTOS: '/gastos',
  RESENAS: '/resenas',
  REPORTES: '/reportes',
  // Públicas (sin login).
  TURNERO: '/turnero',
  ENCUESTA: '/encuesta/:token',
} as const;
