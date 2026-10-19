import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './facturas.service';

export async function cerrarDiario(req: AuthRequest, res: Response): Promise<void> {
  try {
    const fecha = (req.query.fecha as string) || new Date().toISOString().slice(0, 10);
    const facturas = await service.cerrarDiario(fecha);
    res.json(facturas);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function getFacturas(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { fecha, clienteId } = req.query as Record<string, string>;
    const facturas = await service.getFacturas({ fecha, clienteId: clienteId ? parseInt(clienteId) : undefined });
    res.json(facturas);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function getFactura(req: AuthRequest, res: Response): Promise<void> {
  try {
    const factura = await service.getFactura(parseInt(req.params.id));
    res.json(factura);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function marcarPagada(req: AuthRequest, res: Response): Promise<void> {
  try {
    const factura = await service.marcarPagada(parseInt(req.params.id));
    res.json(factura);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function saldoPendiente(req: AuthRequest, res: Response): Promise<void> {
  try {
    const saldo = await service.saldoPendientePorCliente(parseInt(req.params.clienteId));
    res.json({ saldo });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export async function emitirEnArca(req: AuthRequest, res: Response): Promise<void> {
  try {
    const factura = await service.emitirEnArca(parseInt(req.params.id));
    res.json(factura);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}
