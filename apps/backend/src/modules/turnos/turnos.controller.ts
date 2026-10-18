import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './turnos.service';

export async function getTurnosDelDia(req: AuthRequest, res: Response): Promise<void> {
  try {
    const fecha = (req.query.fecha as string) || new Date().toISOString().slice(0, 10);
    const turnos = await service.getTurnosDelDia(fecha);
    res.json(turnos);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function createTurno(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: errors.array() });
    return;
  }
  try {
    const turno = await service.createTurno(req.body);
    res.status(201).json(turno);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function updateTurno(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: errors.array() });
    return;
  }
  try {
    const turno = await service.updateTurno(parseInt(req.params.id), req.body);
    res.json(turno);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

function makeAction(fn: (id: number) => Promise<unknown>) {
  return async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const turno = await fn(parseInt(req.params.id));
      res.json(turno);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message, code: err.code });
    }
  };
}

export const completarTurno = makeAction(service.completarTurno);
export const reabrirTurno = makeAction(service.reabrirTurno);
export const cancelarTurno = makeAction(service.cancelarTurno);
export const togglePago = makeAction(service.togglePago);
export const toggleFacturar = makeAction(service.toggleFacturar);
