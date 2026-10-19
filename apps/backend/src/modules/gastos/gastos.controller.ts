import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './gastos.service';

function validate(req: AuthRequest, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: errors.array() });
    return false;
  }
  return true;
}

export async function getGastos(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { fecha } = req.query as Record<string, string>;
    const gastos = await service.getGastosDelDia(fecha);
    res.json(gastos);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function createGasto(req: AuthRequest, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const gasto = await service.createGasto(req.body);
    res.status(201).json(gasto);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function deleteGasto(req: AuthRequest, res: Response): Promise<void> {
  try {
    await service.deleteGasto(parseInt(req.params.id));
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
