import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware';
import { getResenas, getResenasAprobadas, aprobarResena, ocultarResena, getEncuesta, responderEncuesta } from './resenas.controller';

const router = Router();

// Públicas (sin login): la encuesta que llega por WhatsApp y la lista para
// el turnero público. El resto del módulo (moderación) requiere sesión.
router.get('/publicas', getResenasAprobadas);
router.get('/encuesta/:token', getEncuesta);
router.post(
  '/encuesta/:token',
  [body('puntaje').isInt({ min: 1, max: 5 }).withMessage('Puntaje inválido')],
  responderEncuesta
);

router.get('/', authenticate, getResenas);
router.patch('/:id/aprobar', authenticate, aprobarResena);
router.patch('/:id/ocultar', authenticate, ocultarResena);

export default router;
