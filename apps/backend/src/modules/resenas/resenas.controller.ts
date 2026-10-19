import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './resenas.service';
import { EstadoResena } from '@prisma/client';

function validate(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: errors.array() });
    return false;
  }
  return true;
}

export async function getResenas(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { estado } = req.query as Record<string, string>;
    const resenas = await service.getResenas({ estado: estado as EstadoResena | undefined });
    res.json(resenas);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function getResenasAprobadas(_req: Request, res: Response): Promise<void> {
  try {
    const resenas = await service.getResenasAprobadas();
    res.json(resenas);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function aprobarResena(req: AuthRequest, res: Response): Promise<void> {
  try {
    const resena = await service.aprobarResena(parseInt(req.params.id));
    res.json(resena);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function ocultarResena(req: AuthRequest, res: Response): Promise<void> {
  try {
    const resena = await service.ocultarResena(parseInt(req.params.id));
    res.json(resena);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function getEncuesta(req: Request, res: Response): Promise<void> {
  try {
    const turno = await service.getEncuestaPorToken(req.params.token);
    res.json(turno);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function responderEncuesta(req: Request, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const resena = await service.responderEncuesta(req.params.token, req.body.puntaje, req.body.comentario);
    res.status(201).json(resena);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
