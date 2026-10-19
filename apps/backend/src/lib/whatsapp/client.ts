import { whatsappConfig, isWhatsappHabilitado } from './config';

// Tipado mínimo: whatsapp-web.js no se importa en el nivel de módulo para no
// pagar el costo de cargar puppeteer cuando WHATSAPP_ENABLED=false (el caso
// por defecto en desarrollo mientras no hay una sesión real).
type WwebClient = {
  initialize: () => Promise<void>;
  sendMessage: (chatId: string, texto: string) => Promise<unknown>;
  on: (evento: string, cb: (...args: unknown[]) => void) => void;
};

let client: WwebClient | null = null;
let ready = false;

function crearCliente(): WwebClient {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Client, LocalAuth } = require('whatsapp-web.js');
  const nuevo: WwebClient = new Client({ authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }) });
  nuevo.on('qr', (qr: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const qrcode = require('qrcode');
    console.log('[WhatsApp] Escaneá este QR con el número dedicado del lavadero:');
    qrcode.toString(qr as string, { type: 'terminal', small: true }, (err: Error | null, url: string) => {
      if (err) console.error('[WhatsApp] No se pudo generar el QR:', err);
      else console.log(url);
    });
  });
  nuevo.on('ready', () => {
    ready = true;
    console.log('[WhatsApp] Sesión lista — ya se pueden enviar mensajes.');
  });
  nuevo.on('disconnected', () => {
    ready = false;
    console.warn('[WhatsApp] Sesión desconectada.');
  });
  return nuevo;
}

// Se llama una vez al iniciar el servidor (ver index.ts). No hace nada si
// WHATSAPP_ENABLED no está activado.
export function iniciarWhatsappSiCorresponde(): void {
  if (!whatsappConfig.enabled || client) return;
  client = crearCliente();
  client.initialize().catch((err) => console.error('[WhatsApp] Error al inicializar:', err));
}

export function isWhatsappConfigurado(): boolean {
  return isWhatsappHabilitado() && ready;
}

export async function enviarMensaje(telefono: string, texto: string): Promise<void> {
  if (!client || !isWhatsappConfigurado()) {
    throw { status: 503, code: 'WHATSAPP_NO_CONFIGURADO', message: 'WhatsApp no está configurado todavía.' };
  }
  const numero = telefono.replace(/\D/g, '');
  await client.sendMessage(`${numero}@c.us`, texto);
}
