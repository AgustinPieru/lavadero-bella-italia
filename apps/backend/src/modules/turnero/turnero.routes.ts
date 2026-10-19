import { Router } from 'express';
import { body, query } from 'express-validator';
import { getEmpresas, getDisponibilidad, reservarTurno } from './turnero.controller';

// Todo el módulo es público (sin login) — es el turnero que usa el cliente
// final para reservar su propio turno (Etapa 4).
const router = Router();

router.get('/empresas', getEmpresas);

router.get('/disponibilidad', [query('fecha').trim().notEmpty(), query('vehiculo').isIn(['CAMION', 'AUTO'])], getDisponibilidad);

router.post(
  '/reservar',
  [
    body('vehiculoTipo').isIn(['CAMION', 'AUTO']).withMessage('Tipo de vehículo inválido'),
    body('subtipo').trim().notEmpty().withMessage('Subtipo requerido'),
    body('servicioId').isInt().withMessage('Servicio requerido'),
    body('fecha').trim().notEmpty().withMessage('Fecha requerida'),
    body('hora').trim().notEmpty().withMessage('Hora requerida'),
    body('denominacion').trim().notEmpty().withMessage('Denominación requerida'),
    body('telefono').trim().notEmpty().withMessage('Teléfono requerido'),
    body('patente').trim().notEmpty().withMessage('Patente requerida'),
    body('formaPago').isIn(['CONTADO', 'TRANSFERENCIA', 'EFECTIVO', 'CUENTA_CORRIENTE']).withMessage('Forma de pago inválida'),
    body('empresaId').optional({ values: 'null' }).isInt().withMessage('Empresa inválida'),
  ],
  reservarTurno
);

export default router;
