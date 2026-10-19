// Configuración de la integración con ARCA (ex-AFIP) — Web Service de
// Factura Electrónica (WSFEv1) + Web Service de Autenticación (WSAA).
//
// Nada de esto se activa solo: mientras falten CUIT/certificado/clave
// privada, isArcaConfigurado() da false y arcaClient.ts corta con un error
// claro ANTES de intentar cualquier llamada real a ARCA.
//
// Para activarlo en el futuro:
//   1. Gestionar en ARCA (con Clave Fiscal) un certificado digital para el
//      CUIT del lavadero, autorizado para el servicio "wsfe".
//   2. Guardar el certificado (.crt/.pem) y la clave privada (.key) en
//      apps/backend/certs/ (carpeta gitignoreada) o donde indiquen las env vars.
//   3. Completar las variables de entorno de abajo.
//   4. Para probar primero en homologación (testing), dejar ARCA_ENV=homologacion
//      — ahí ARCA da certificados de prueba aparte, no sirven los de producción.

export type ArcaEnv = 'homologacion' | 'produccion';

export const arcaConfig = {
  env: (process.env.ARCA_ENV as ArcaEnv) || 'homologacion',
  cuit: process.env.ARCA_CUIT || '',
  certPath: process.env.ARCA_CERT_PATH || '',
  keyPath: process.env.ARCA_KEY_PATH || '',
  puntoVenta: parseInt(process.env.ARCA_PUNTO_VENTA || '0', 10),
};

export function isArcaConfigurado(): boolean {
  return !!(arcaConfig.cuit && arcaConfig.certPath && arcaConfig.keyPath && arcaConfig.puntoVenta);
}

// URLs oficiales — ver "Manual para el desarrollador V.4.7" (WSFEv1) y
// "Especificación Técnica WSAA", ambos en arca.gob.ar/afip.gob.ar.
export const ARCA_URLS = {
  homologacion: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfev1: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  },
  produccion: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfev1: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
  },
} as const;

export function getArcaUrls() {
  return ARCA_URLS[arcaConfig.env];
}
