import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getEstadoWhatsapp, forzarReconexion, desvincularWhatsapp } from '../../lib/whatsapp/client';

export function getEstado(_req: AuthRequest, res: Response): void {
  res.json(getEstadoWhatsapp());
}

export async function reconectar(_req: AuthRequest, res: Response): Promise<void> {
  try {
    await forzarReconexion();
    res.json(getEstadoWhatsapp());
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function desvincular(_req: AuthRequest, res: Response): Promise<void> {
  try {
    await desvincularWhatsapp();
    res.json(getEstadoWhatsapp());
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
