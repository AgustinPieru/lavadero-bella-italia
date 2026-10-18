import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getTurnosDelDia,
  createTurno,
  updateTurno,
  completarTurno,
  reabrirTurno,
  cancelarTurno,
  togglePago,
  toggleFacturar,
} from './turnos.controller';

const router = Router();

router.use(authenticate);

const turnoValidators = [
  body('hora').trim().notEmpty().withMessage('Hora requerida'),
  body('linea').isIn(['A', 'B']).withMessage('Línea inválida'),
  body('vehiculoId').isInt().withMessage('Vehículo requerido'),
  body('servicioId').isInt().withMessage('Servicio requerido'),
  body('formaPago').isIn(['CONTADO', 'TRANSFERENCIA', 'EFECTIVO', 'CUENTA_CORRIENTE']).withMessage('Forma de pago inválida'),
];

router.get('/', getTurnosDelDia);
router.post('/', [...turnoValidators, body('fecha').trim().notEmpty().withMessage('Fecha requerida')], createTurno);
router.put('/:id', turnoValidators, updateTurno);
router.patch('/:id/completar', completarTurno);
router.patch('/:id/reabrir', reabrirTurno);
router.patch('/:id/cancelar', cancelarTurno);
router.patch('/:id/pago', togglePago);
router.patch('/:id/facturar', toggleFacturar);

export default router;
