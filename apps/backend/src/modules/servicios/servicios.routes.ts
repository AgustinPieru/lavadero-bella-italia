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

const servicioValidators = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('vehiculo').isIn(['CAMION', 'AUTO']).withMessage('Vehículo inválido'),
  body('subtipo').trim().notEmpty().withMessage('Subtipo requerido'),
  body('precio').isInt({ min: 1 }).withMessage('Precio inválido'),
];

// Públicas (sin login): el turnero público (Etapa 4) necesita leer los
// servicios activos y sus subtipos para armar el paso 1 de la reserva. Con
// admin=true (uso interno del ABM) sí requiere sesión.
router.get('/', (req, res, next) => (req.query.admin === 'true' ? authenticate(req, res, next) : next()), getServicios);
router.get('/subtipos/:vehiculo', getSubtipos);

router.post('/', authenticate, servicioValidators, createServicio);
router.put('/:id', authenticate, servicioValidators, updateServicio);
router.patch('/:id/precio', authenticate, [body('precio').isInt({ min: 1 }).withMessage('Precio inválido')], updatePrecio);
router.patch('/:id/desactivar', authenticate, desactivarServicio);
router.patch('/:id/reactivar', authenticate, reactivarServicio);

export default router;
