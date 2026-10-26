import { randomBytes } from 'crypto';
import { env } from '../../config/env';
import { enviarMensaje } from './client';

// Mismo link real que usa el footer del sitio (ver SiteFooter.tsx en el
// frontend) — Parque Industrial, Bella Italia, Santa Fe.
const UBICACION_MAPS =
  'https://www.google.com/maps/place/Lavadero+Bella+Italia/@-31.2720819,-61.4328073,893m/data=!3m2!1e3!4b1!4m6!3m5!1s0x95caaf3a80e7431b:0x6ff3b844527fe984!8m2!3d-31.2720819!4d-61.4302324!16s%2Fg%2F11zbgspb4f';

export function generarResenaToken(): string {
  return randomBytes(16).toString('hex');
}

// Se llama al completar un turno (ver turnos.service.ts). Nunca debe romper
// el flujo de completar el turno: si WhatsApp no está configurado o falla
// el envío, solo se loguea — el turno queda completo igual y el link de
// encuesta sigue siendo válido aunque el mensaje no haya salido.
export async function enviarEncuestaResena(telefono: string, denominacionCliente: string, token: string): Promise<void> {
  const link = `${env.FRONTEND_URL}/encuesta/${token}`;
  const texto = [
    `¡Hola ${denominacionCliente}! 🚛`,
    '',
    'Gracias por confiar en *Lavadero Bella Italia*. Nos encantaría saber cómo te fue con el servicio — te toma menos de un minuto y nos ayuda un montón a seguir mejorando:',
    '',
    link,
    '',
    '¡Gracias por tu tiempo!',
  ].join('\n');
  try {
    await enviarMensaje(telefono, texto);
  } catch (err: any) {
    if (err?.code !== 'WHATSAPP_NO_CONFIGURADO') {
      console.error('[WhatsApp] Error al enviar encuesta de reseña:', err);
    }
  }
}

// Se llama al confirmar una reserva hecha desde el turnero público (ver
// turnero.service.ts). Igual que la encuesta: nunca debe romper la reserva
// si WhatsApp no está configurado o falla el envío.
export async function enviarConfirmacionTurno(
  telefono: string,
  denominacionCliente: string,
  detalle: { fecha: string; hora: string; servicioNombre: string; precioNeto: number }
): Promise<void> {
  const fechaLegible = new Date(`${detalle.fecha}T00:00:00.000Z`).toLocaleDateString('es-AR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const texto = [
    `¡Hola ${denominacionCliente}! 🚛`,
    '',
    'Tu turno en *Lavadero Bella Italia* quedó confirmado:',
    '',
    `🧽 ${detalle.servicioNombre}`,
    `📅 ${fechaLegible} a las ${detalle.hora} hs`,
    `💵 Total neto: $${detalle.precioNeto.toLocaleString('es-AR')}`,
    '',
    `📍 Cómo llegar: ${UBICACION_MAPS}`,
    '',
    '¡Te esperamos!',
  ].join('\n');
  try {
    await enviarMensaje(telefono, texto);
  } catch (err: any) {
    if (err?.code !== 'WHATSAPP_NO_CONFIGURADO') {
      console.error('[WhatsApp] Error al enviar confirmación de turno:', err);
    }
  }
}
