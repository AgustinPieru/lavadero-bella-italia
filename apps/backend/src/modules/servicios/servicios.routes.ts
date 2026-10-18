import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getServicios, getSubtipos } from './servicios.controller';

const router = Router();

router.use(authenticate);

router.get('/', getServicios);
router.get('/subtipos/:vehiculo', getSubtipos);

export default router;
