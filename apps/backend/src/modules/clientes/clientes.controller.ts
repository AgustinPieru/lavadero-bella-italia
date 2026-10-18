import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './clientes.service';

function validate(req: AuthRequest, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: errors.array() });
    return false;
  }
  return true;
}

export async function getClientes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { search, incluirInactivos } = req.query as Record<string, string>;
    const clientes = await service.getClientes({ search, incluirInactivos: incluirInactivos === 'true' });
    res.json(clientes);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function getCliente(req: AuthRequest, res: Response): Promise<void> {
  try {
    const cliente = await service.getCliente(parseInt(req.params.id));
    res.json(cliente);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function createCliente(req: AuthRequest, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const cliente = await service.createCliente(req.body);
    res.status(201).json(cliente);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function updateCliente(req: AuthRequest, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const cliente = await service.updateCliente(parseInt(req.params.id), req.body);
    res.json(cliente);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function desactivarCliente(req: AuthRequest, res: Response): Promise<void> {
  try {
    const cliente = await service.desactivarCliente(parseInt(req.params.id));
    res.json(cliente);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function reactivarCliente(req: AuthRequest, res: Response): Promise<void> {
  try {
    const cliente = await service.reactivarCliente(parseInt(req.params.id));
    res.json(cliente);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function addVehiculo(req: AuthRequest, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const vehiculo = await service.addVehiculo(parseInt(req.params.id), req.body);
    res.status(201).json(vehiculo);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function updateVehiculo(req: AuthRequest, res: Response): Promise<void> {
  if (!validate(req, res)) return;
  try {
    const vehiculo = await service.updateVehiculo(parseInt(req.params.vehiculoId), req.body);
    res.json(vehiculo);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function desactivarVehiculo(req: AuthRequest, res: Response): Promise<void> {
  try {
    const vehiculo = await service.desactivarVehiculo(parseInt(req.params.vehiculoId));
    res.json(vehiculo);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function reactivarVehiculo(req: AuthRequest, res: Response): Promise<void> {
  try {
    const vehiculo = await service.reactivarVehiculo(parseInt(req.params.vehiculoId));
    res.json(vehiculo);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
