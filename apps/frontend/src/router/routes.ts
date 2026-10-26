// El turnero público es la Home del sitio — todo lo administrativo vive
// bajo /admin (con login propio en /admin/login).
export const ROUTES = {
  LOGIN: '/admin/login',
  DASHBOARD: '/admin',
  CLIENTES: '/admin/clientes',
  SERVICIOS: '/admin/servicios',
  HORARIOS: '/admin/horarios',
  EMPRESAS: '/admin/empresas',
  FACTURACION: '/admin/facturacion',
  GASTOS: '/admin/gastos',
  RESENAS: '/admin/resenas',
  REPORTES: '/admin/reportes',
  WHATSAPP: '/admin/whatsapp',
  // Públicas (sin login).
  TURNERO: '/',
  ENCUESTA: '/encuesta/:token',
} as const;
