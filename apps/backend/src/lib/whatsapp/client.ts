import { mkdirSync, rmSync } from 'fs';
import { resolve } from 'path';
import { execFileSync } from 'child_process';
import { whatsappConfig, isWhatsappHabilitado } from './config';

const SESSION_DIR = resolve('.wwebjs_auth/session');

// client.destroy() no siempre mata de verdad el proceso de Chromium viejo
// (se vio colgado incluso llamándolo a propósito) — y si el proceso previo
// se cortó de golpe (crash, kill -9, reinicio del servidor) directamente no
// hay nadie que lo llame. En cualquiera de los dos casos, el perfil queda
// "trabado" (SingletonLock apuntando a un proceso que sigue vivo o que ya
// no existe) y el próximo intento de lanzar el browser falla con "browser
// is already running". Se mata por las dudas cualquier Chromium que esté
// usando nuestro userDataDir, y se limpian los locks — garantiza que el
// próximo launch arranca de cero.
function limpiarSesionAnterior(): void {
  try {
    // Sin "--" al principio del patrón: pkill lo toma como una opción más
    // en vez de cómo el patrón a buscar ("illegal option -- -").
    execFileSync('pkill', ['-f', `user-data-dir=${SESSION_DIR}`]);
    console.log('[WhatsApp] Se cerró un proceso de Chromium de una sesión anterior.');
  } catch {
    // pkill devuelve código de error si no encontró nada para matar — es el
    // caso normal (no había nada corriendo).
  }
  for (const f of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
    rmSync(resolve(SESSION_DIR, f), { force: true });
  }
}

// Tipado mínimo: whatsapp-web.js no se importa en el nivel de módulo para no
// pagar el costo de cargar puppeteer cuando WHATSAPP_ENABLED=false (el caso
// por defecto en desarrollo mientras no hay una sesión real).
type WwebClient = {
  initialize: () => Promise<void>;
  destroy: () => Promise<void>;
  logout: () => Promise<void>;
  sendMessage: (chatId: string, texto: string) => Promise<unknown>;
  getNumberId: (numero: string) => Promise<{ _serialized: string } | null>;
  on: (evento: string, cb: (...args: unknown[]) => void) => void;
  info?: { wid?: { user?: string }; pushname?: string };
};

export interface EstadoWhatsapp {
  habilitado: boolean;
  conectado: boolean;
  numero: string | null;
  nombre: string | null;
  qrDataUrl: string | null;
}

let client: WwebClient | null = null;
let ready = false;
let ultimoQrDataUrl: string | null = null;

// Nota: se probó lanzar el browser a mano con puppeteer-extra + stealth y
// conectarlo por WebSocket (browserWSEndpoint) para endurecer la sesión
// contra detección de automatización. Se volvió atrás: ese patrón deja a
// whatsapp-web.js con una referencia de "Frame" que se desincroniza del
// browser real apenas WhatsApp Web hace un refresco interno, y las llamadas
// siguientes tiran "Attempted to use detached Frame". Dejamos que
// whatsapp-web.js lance y maneje su propio Chromium (su camino nativo,
// mucho más probado) — LocalAuth se encarga sola de la persistencia ahí.
function crearCliente(): WwebClient {
  limpiarSesionAnterior();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Client, LocalAuth } = require('whatsapp-web.js');
  const nuevo: WwebClient = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: whatsappConfig.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });
  nuevo.on('qr', (qr: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const qrcode = require('qrcode');
    console.log('[WhatsApp] Escaneá este QR con WhatsApp > Dispositivos vinculados > Vincular dispositivo:');
    qrcode.toString(qr as string, { type: 'terminal', small: true }, (err: Error | null, url: string) => {
      if (err) console.error('[WhatsApp] No se pudo generar el QR:', err);
      else console.log(url);
    });
    // También se guarda en memoria como data URL — lo sirve el endpoint de
    // estado (ver whatsapp.service.ts) para mostrarlo en el admin, sin
    // depender de la terminal del servidor.
    qrcode.toDataURL(qr as string, { width: 320 }, (err: Error | null, dataUrl: string) => {
      if (!err) ultimoQrDataUrl = dataUrl;
    });
    // Y como imagen en disco, útil para debugging directo del servidor.
    mkdirSync('.wwebjs_auth', { recursive: true });
    qrcode.toFile('.wwebjs_auth/ultimo-qr.png', qr as string, { width: 400 }, (err: Error | null) => {
      if (err) console.error('[WhatsApp] No se pudo guardar el QR como imagen:', err);
    });
  });
  nuevo.on('ready', () => {
    ready = true;
    ultimoQrDataUrl = null;
    console.log('[WhatsApp] Sesión lista — ya se pueden enviar mensajes.');
  });
  nuevo.on('disconnected', (razon: unknown) => {
    ready = false;
    console.warn('[WhatsApp] Sesión desconectada:', razon);
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

function esperar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function cerrarWhatsapp(): Promise<void> {
  ready = false;
  if (client) await client.destroy().catch(() => undefined);
  client = null;
  // No alcanza con confiar en que destroy() haya cerrado el Chromium de
  // verdad (se vio quedar colgado) — crearCliente() se encarga de matar
  // cualquier resto antes de lanzar uno nuevo (ver limpiarSesionAnterior).
}

// Para el botón "Generar nuevo QR" / reconectar del admin, y para la
// auto-recuperación cuando se detecta un frame roto (ver enviarMensaje) —
// tira la sesión actual (si la hay) y arranca una nueva desde cero. OJO:
// como la sesión en disco (.wwebjs_auth/session) queda intacta, el cliente
// nuevo reconecta SOLO a la misma cuenta, sin pedir QR — esto es "reiniciar
// la conexión", no "desvincular el número" (para eso ver desvincularWhatsapp).
export async function forzarReconexion(): Promise<void> {
  ultimoQrDataUrl = null;
  await cerrarWhatsapp();
  iniciarWhatsappSiCorresponde();
}

// Para el botón "Desvincular" del admin — a diferencia de forzarReconexion(),
// esto tiene que dejar la sesión realmente desvinculada (que el próximo
// arranque pida un QR nuevo). client.logout() hace el logout real contra
// WhatsApp (saca el dispositivo de la lista del celular) y borra la sesión
// en disco — pero no hay que confiar ciegamente en que termine bien (ya se
// vio a destroy() quedarse colgado en este mismo entorno), así que
// independientemente de si logout() tira error o no, se fuerza además el
// borrado completo del perfil para garantizar que quede desvinculado.
export async function desvincularWhatsapp(): Promise<void> {
  ready = false;
  ultimoQrDataUrl = null;
  if (client) {
    await client.logout().catch((err) => console.warn('[WhatsApp] logout() no terminó limpio, se fuerza igual:', err));
  }
  client = null;
  limpiarSesionAnterior();
  rmSync(SESSION_DIR, { recursive: true, force: true });
  iniciarWhatsappSiCorresponde();
}

// Espera a que la sesión quede lista después de forzarReconexion() — como
// el perfil ya está vinculado, no debería pedir QR, solo tarda unos
// segundos en reconectar.
async function esperarListo(timeoutMs: number): Promise<void> {
  const inicio = Date.now();
  while (!ready) {
    if (Date.now() - inicio > timeoutMs) throw new Error('Timeout esperando que WhatsApp quede listo');
    await esperar(500);
  }
}

export function isWhatsappConfigurado(): boolean {
  return isWhatsappHabilitado() && ready;
}

export function getEstadoWhatsapp(): EstadoWhatsapp {
  return {
    habilitado: whatsappConfig.enabled,
    conectado: ready,
    numero: ready ? client?.info?.wid?.user ?? null : null,
    nombre: ready ? client?.info?.pushname ?? null : null,
    qrDataUrl: ready ? null : ultimoQrDataUrl,
  };
}

function esErrorDeFrameDetached(err: unknown): boolean {
  return err instanceof Error && err.message.includes('detached Frame');
}

// A veces el frame de la página queda roto (CDP marca "detached") y no se
// recupera solo por más que se espere — probado en headless y con ventana
// visible, en ambos casos queda muerto para siempre dentro de esa misma
// sesión de Chromium. La única salida real es reiniciar la sesión de
// WhatsApp entera (como el perfil ya está vinculado, reconecta sin pedir
// QR) y reintentar el envío una vez contra el cliente nuevo. Esto es
// fire-and-forget desde el llamador, no bloquea ninguna respuesta HTTP —
// que tarde ~20s extra en reconectar no tiene costo para el usuario.
async function conReintentoPorFrameDetached<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!esErrorDeFrameDetached(err)) throw err;
    console.warn('[WhatsApp] Frame roto — reiniciando la sesión para reintentar...');
    await forzarReconexion();
    await esperarListo(20000);
    return fn();
  }
}

export async function enviarMensaje(telefono: string, texto: string): Promise<void> {
  if (!client || !isWhatsappConfigurado()) {
    throw { status: 503, code: 'WHATSAPP_NO_CONFIGURADO', message: 'WhatsApp no está configurado todavía.' };
  }
  const numero = telefono.replace(/\D/g, '');
  await conReintentoPorFrameDetached(async () => {
    if (!client) return;
    // No alcanza con armar "numero@c.us" a mano: desde que WhatsApp usa IDs
    // propios (LID) además del número de teléfono, hay que resolver el chat
    // real vía getNumberId() antes de mandar — si no, sendMessage tira
    // "No LID for user" aunque el número exista.
    const wid = await client.getNumberId(numero);
    if (!wid) {
      throw { status: 422, code: 'NUMERO_NO_REGISTRADO', message: `El número ${telefono} no está registrado en WhatsApp.` };
    }
    await client.sendMessage(wid._serialized, texto);
  });
}
