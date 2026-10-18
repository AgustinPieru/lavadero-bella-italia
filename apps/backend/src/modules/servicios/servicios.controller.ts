import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './servicios.service';
import { VehiculoTipo } from '@prisma/client';

function validate(req: AuthRequest, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: errors.array() });
    return false;
  }
  return true;
}

export async function getServicios(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { vehiculo, subtipo, admin } = req.query as Record<string, string>;
    const servicios =
      admin === 'true'
        ? await service.getServiciosAdmin()
        : await service.getServicios({ vehiculo: vehiculo as VehiculoTipo | undefined, subtipo });
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

export async function createServicio(req: AuthRequest, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const servicio = await service.createServicio(req.body);
    res.status(201).json(servicio);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function updateServicio(req: AuthRequest, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const servicio = await service.updateServicio(parseInt(req.params.id), req.body);
    res.json(servicio);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function updatePrecio(req: AuthRequest, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const servicio = await service.updatePrecio(parseInt(req.params.id), req.body.precio);
    res.json(servicio);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function desactivarServicio(req: AuthRequest, res: Response): Promise<void> {
  try {
    const servicio = await service.desactivarServicio(parseInt(req.params.id));
    res.json(servicio);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function reactivarServicio(req: AuthRequest, res: Response): Promise<void> {
  try {
    const servicio = await service.reactivarServicio(parseInt(req.params.id));
    res.json(servicio);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
