import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getEstado, reconectar, desvincular } from './whatsapp.controller';

const router = Router();

router.use(authenticate);

router.get('/estado', getEstado);
router.post('/reconectar', reconectar);
router.post('/desvincular', desvincular);

export default router;
