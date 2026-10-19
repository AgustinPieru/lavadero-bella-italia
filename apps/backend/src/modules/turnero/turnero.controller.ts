import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as service from './turnero.service';
import { VehiculoTipo } from '@prisma/client';

function validate(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: errors.array() });
    return false;
  }
  return true;
}

export async function getEmpresas(_req: Request, res: Response): Promise<void> {
  try {
    const empresas = await service.getEmpresasPublicas();
    res.json(empresas);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function getDisponibilidad(req: Request, res: Response): Promise<void> {
  try {
    const { fecha, vehiculo } = req.query as Record<string, string>;
    const disponibilidad = await service.getDisponibilidad(fecha, vehiculo as VehiculoTipo);
    res.json(disponibilidad);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function reservarTurno(req: Request, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const turno = await service.reservarTurno(req.body);
    res.status(201).json(turno);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
