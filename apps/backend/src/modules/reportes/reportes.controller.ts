import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './reportes.service';
import { generarReportePdf } from './reportes.pdf';

function getRango(req: AuthRequest): { desde: string; hasta: string } {
  const { desde, hasta } = req.query as Record<string, string>;
  if (!desde || !hasta) throw { status: 422, message: 'Rango de fechas requerido', code: 'VALIDATION_ERROR' };
  return { desde, hasta };
}

export async function getReporte(req: AuthRequest, res: Response): Promise<void> {
  try {
    const reporte = await service.computeReporte(getRango(req));
    res.json(reporte);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function getReportePdf(req: AuthRequest, res: Response): Promise<void> {
  try {
    await generarReportePdf(res, getRango(req));
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
