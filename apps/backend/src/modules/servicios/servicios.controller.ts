import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './servicios.service';
import { VehiculoTipo } from '@prisma/client';

export async function getServicios(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { vehiculo, subtipo } = req.query as Record<string, string>;
    const servicios = await service.getServicios({
      vehiculo: vehiculo as VehiculoTipo | undefined,
      subtipo,
    });
    res.json(servicios);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function getSubtipos(req: AuthRequest, res: Response): Promise<void> {
  try {
    const vehiculo = req.params.vehiculo as VehiculoTipo;
    const subtipos = await service.getSubtipos(vehiculo);
    res.json(subtipos);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
