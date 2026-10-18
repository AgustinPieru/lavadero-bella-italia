import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'Recurso no encontrado', code: 'NOT_FOUND' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_ERROR',
  });
}
