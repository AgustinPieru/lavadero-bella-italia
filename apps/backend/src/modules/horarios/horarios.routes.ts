import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getHorarios, updateHorarioDia } from './horarios.controller';

const router = Router();

router.use(authenticate);

router.get('/', getHorarios);
router.put('/:dia', updateHorarioDia);

export default router;
