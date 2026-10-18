import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getClientes,
  getCliente,
  createCliente,
  updateCliente,
  desactivarCliente,
  reactivarCliente,
  addVehiculo,
  updateVehiculo,
  desactivarVehiculo,
  reactivarVehiculo,
} from './clientes.controller';

const router = Router();

router.use(authenticate);

const clienteValidators = [
  body('denominacion').trim().notEmpty().withMessage('Denominación requerida'),
  body('telefono').trim().notEmpty().withMessage('Teléfono requerido'),
];

const vehiculoValidators = [
  body('tipo').isIn(['CAMION', 'AUTO']).withMessage('Tipo de vehículo inválido'),
  body('subtipo').trim().notEmpty().withMessage('Subtipo requerido'),
];

// En el alta de cliente, el vehículo viaja anidado en el body ({ ...datos, vehiculo: {...} })
const vehiculoAnidadoValidators = [
  body('vehiculo.tipo').isIn(['CAMION', 'AUTO']).withMessage('Tipo de vehículo inválido'),
  body('vehiculo.subtipo').trim().notEmpty().withMessage('Subtipo requerido'),
];

router.get('/', getClientes);
router.get('/:id', getCliente);
router.post('/', [...clienteValidators, ...vehiculoAnidadoValidators], createCliente);
router.put('/:id', clienteValidators, updateCliente);
router.patch('/:id/desactivar', desactivarCliente);
router.patch('/:id/reactivar', reactivarCliente);

router.post('/:id/vehiculos', vehiculoValidators, addVehiculo);
router.put('/:id/vehiculos/:vehiculoId', vehiculoValidators, updateVehiculo);
router.patch('/:id/vehiculos/:vehiculoId/desactivar', desactivarVehiculo);
router.patch('/:id/vehiculos/:vehiculoId/reactivar', reactivarVehiculo);

export default router;
