import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware';
import { getGastos, createGasto, deleteGasto } from './gastos.controller';

const router = Router();

router.use(authenticate);

const gastoValidators = [
  body('fecha').trim().notEmpty().withMessage('Fecha requerida'),
  body('categoria').isIn(['SUELDOS', 'IMPUESTOS', 'SERVICIOS', 'INSUMOS', 'OTRO']).withMessage('Categoría inválida'),
  body('monto').isFloat({ min: 0.01 }).withMessage('Monto inválido'),
];

router.get('/', getGastos);
router.post('/', gastoValidators, createGasto);
router.delete('/:id', deleteGasto);

export default router;
