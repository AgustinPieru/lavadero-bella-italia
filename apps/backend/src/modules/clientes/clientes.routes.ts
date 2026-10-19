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
  getEmpresas,
  marcarComoEmpresa,
  actualizarEmpresa,
  quitarEmpresa,
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

const empresaValidators = [
  body('facturacion').isIn(['ARCA', 'INTERNA']).withMessage('Tipo de facturación inválido'),
  body('cuentaCorrienteHabilitada').isBoolean().withMessage('Valor inválido'),
  body('descuentoPct').optional({ values: 'null' }).isInt({ min: 0, max: 100 }).withMessage('Descuento inválido'),
];

// Rutas específicas ANTES de '/:id' para que Express no confunda "empresas"
// con un id de cliente.
router.get('/empresas', getEmpresas);

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

router.patch('/:id/empresa', empresaValidators, marcarComoEmpresa);
router.put('/:id/empresa', empresaValidators, actualizarEmpresa);
router.patch('/:id/empresa/quitar', quitarEmpresa);

export default router;
