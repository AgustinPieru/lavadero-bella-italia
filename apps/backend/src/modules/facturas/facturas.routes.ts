import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { cerrarDiario, getFacturas, getFactura, marcarPagada, saldoPendiente, emitirEnArca } from './facturas.controller';

const router = Router();

router.use(authenticate);

router.post('/cierre-diario', cerrarDiario);
router.get('/', getFacturas);
router.get('/saldo/:clienteId', saldoPendiente);
router.get('/:id', getFactura);
router.patch('/:id/pagar', marcarPagada);
router.post('/:id/emitir-arca', emitirEnArca);

export default router;
