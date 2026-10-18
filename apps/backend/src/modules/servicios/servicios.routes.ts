import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getServicios,
  getSubtipos,
  createServicio,
  updateServicio,
  updatePrecio,
  desactivarServicio,
  reactivarServicio,
} from './servicios.controller';

const router = Router();

router.use(authenticate);

const servicioValidators = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('vehiculo').isIn(['CAMION', 'AUTO']).withMessage('Vehículo inválido'),
  body('subtipo').trim().notEmpty().withMessage('Subtipo requerido'),
  body('precio').isInt({ min: 1 }).withMessage('Precio inválido'),
];

router.get('/', getServicios);
router.get('/subtipos/:vehiculo', getSubtipos);
router.post('/', servicioValidators, createServicio);
router.put('/:id', servicioValidators, updateServicio);
router.patch('/:id/precio', [body('precio').isInt({ min: 1 }).withMessage('Precio inválido')], updatePrecio);
router.patch('/:id/desactivar', desactivarServicio);
router.patch('/:id/reactivar', reactivarServicio);

export default router;
