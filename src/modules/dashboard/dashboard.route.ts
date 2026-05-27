import { Router } from 'express';
import * as dashboardController from './dashboard.controller.ts';
import authenticate from '../../middlewares/auth.middleware.ts';

const router = Router();

router.use(authenticate);

router.get('/', dashboardController.getDashboardHandler);
router.post('/refresh', dashboardController.refreshDashboardHandler);
router.get('/summary/download', dashboardController.downloadSummaryHandler);

export default router;
