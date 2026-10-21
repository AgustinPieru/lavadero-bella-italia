// Integración de WhatsApp (whatsapp-web.js: https://docs.wwebjs.dev/) — se usa
// para la confirmación de turnos y para mandar el link de encuesta de
// Reseñas. A diferencia de ARCA (que se activa con credenciales), esto
// necesita una sesión real: un número dedicado escanea un QR una vez y la
// sesión queda guardada en apps/backend/.wwebjs_auth/ (gitignueada).
//
// Mientras WHATSAPP_ENABLED no esté en "true", el cliente ni se inicializa
// (evita levantar Chromium en cada reinicio de nodemon) y cualquier intento
// de enviar un mensaje corta con WHATSAPP_NO_CONFIGURADO antes de tocar
// nada real — igual que isArcaConfigurado() en el módulo de Facturación.
//
// Para activarlo en el futuro:
//   1. Setear WHATSAPP_ENABLED=true en .env.
//   2. Levantar el backend y mirar la consola: imprime el QR para escanear
//      con el número dedicado al lavadero (no un celular personal).
//   3. Una vez escaneado, la sesión queda persistida y sobrevive reinicios.

export const whatsappConfig = {
  enabled: process.env.WHATSAPP_ENABLED === 'true',
  // Headless por default (uso normal, día a día) — una ventana visible y sin
  // foco queda sujeta al ahorro de energía de macOS (App Nap), que termina
  // "congelando" la página y produce errores de "detached Frame" al enviar.
  // Poner WHATSAPP_HEADLESS=false solo mientras se vincula el número por
  // primera vez, para ver el QR en una ventana real — y volver a true
  // (o sacar la variable) apenas quede vinculado.
  headless: process.env.WHATSAPP_HEADLESS !== 'false',
};

export function isWhatsappHabilitado(): boolean {
  return whatsappConfig.enabled;
}
