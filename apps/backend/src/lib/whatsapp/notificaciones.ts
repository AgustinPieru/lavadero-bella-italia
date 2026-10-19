import { randomBytes } from 'crypto';
import { env } from '../../config/env';
import { enviarMensaje } from './client';

export function generarResenaToken(): string {
  return randomBytes(16).toString('hex');
}

// Se llama al completar un turno (ver turnos.service.ts). Nunca debe romper
// el flujo de completar el turno: si WhatsApp no está configurado o falla
// el envío, solo se loguea — el turno queda completo igual y el link de
// encuesta sigue siendo válido aunque el mensaje no haya salido.
export async function enviarEncuestaResena(telefono: string, denominacionCliente: string, token: string): Promise<void> {
  const link = `${env.FRONTEND_URL}/encuesta/${token}`;
  const texto = `¡Hola ${denominacionCliente}! Gracias por confiar en Lavadero Bella Italia. ¿Nos contás cómo te fue? ${link}`;
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
    day: 'numeric',
    month: 'long',
  });
  const texto = `¡Hola ${denominacionCliente}! Confirmamos tu turno en Lavadero Bella Italia: ${detalle.servicioNombre} el ${fechaLegible} a las ${detalle.hora} hs. Total neto: $${detalle.precioNeto.toLocaleString('es-AR')}. ¡Te esperamos!`;
  try {
    await enviarMensaje(telefono, texto);
  } catch (err: any) {
    if (err?.code !== 'WHATSAPP_NO_CONFIGURADO') {
      console.error('[WhatsApp] Error al enviar confirmación de turno:', err);
    }
  }
}
