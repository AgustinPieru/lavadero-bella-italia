import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './caja.service';

function validate(req: AuthRequest, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: errors.array() });
    return false;
  }
  return true;
}

export async function getSaldoCaja(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const saldo = await service.getSaldoCaja();
    res.json(saldo);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function setSaldoInicial(req: AuthRequest, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const saldo = await service.setSaldoInicial(req.body);
    res.json(saldo);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
