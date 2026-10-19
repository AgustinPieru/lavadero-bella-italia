import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getReporte, getReportePdf } from './reportes.controller';

const router = Router();

router.use(authenticate);

router.get('/', getReporte);
router.get('/pdf', getReportePdf);

export default router;
