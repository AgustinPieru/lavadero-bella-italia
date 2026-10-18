import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware';
import { getClientes, createCliente } from './clientes.controller';

const router = Router();

router.use(authenticate);

router.get('/', getClientes);

router.post(
  '/',
  [
    body('denominacion').trim().notEmpty().withMessage('Denominación requerida'),
    body('telefono').trim().notEmpty().withMessage('Teléfono requerido'),
    body('vehiculo').isIn(['CAMION', 'AUTO']).withMessage('Vehículo inválido'),
    body('subtipo').trim().notEmpty().withMessage('Subtipo requerido'),
  ],
  createCliente
);

export default router;
