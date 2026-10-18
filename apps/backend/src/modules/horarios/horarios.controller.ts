import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './horarios.service';

export async function getHorarios(req: AuthRequest, res: Response): Promise<void> {
  try {
    const horarios = await service.getHorarios();
    res.json(horarios);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function updateHorarioDia(req: AuthRequest, res: Response): Promise<void> {
  try {
    const diaSemana = parseInt(req.params.dia);
    const horario = await service.updateHorarioDia(diaSemana, req.body);
    res.json(horario);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
