import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware';
import {
  cerrarDiario,
  getFacturas,
  getFactura,
  marcarPagada,
  saldoPendiente,
  emitirEnArca,
  getOrdenTrabajo,
  descargarOrdenTrabajo,
  enviarOrdenTrabajo,
} from './facturas.controller';

const router = Router();

router.use(authenticate);

router.post('/cierre-diario', cerrarDiario);
router.get('/', getFacturas);
router.get('/saldo/:clienteId', saldoPendiente);
router.get('/:id', getFactura);
router.get('/:id/orden-trabajo', getOrdenTrabajo);
router.get('/:id/orden-trabajo.pdf', descargarOrdenTrabajo);
router.post('/:id/orden-trabajo/enviar', enviarOrdenTrabajo);
router.patch(
  '/:id/pagar',
  body('medioPago').isIn(['CUENTA', 'EFECTIVO']).withMessage('Medio de pago inválido'),
  marcarPagada
);
router.post('/:id/emitir-arca', emitirEnArca);

export default router;
