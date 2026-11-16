import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware';
import { getSaldoCaja, setSaldoInicial } from './caja.controller';

const router = Router();

router.use(authenticate);

const saldoInicialValidators = [
  body('fecha').trim().notEmpty().withMessage('Fecha requerida'),
  body('cuenta').isFloat({ min: 0 }).withMessage('Saldo de cuenta inválido'),
  body('efectivo').isFloat({ min: 0 }).withMessage('Saldo de efectivo inválido'),
];

router.get('/', getSaldoCaja);
router.put('/saldo-inicial', saldoInicialValidators, setSaldoInicial);

export default router;
