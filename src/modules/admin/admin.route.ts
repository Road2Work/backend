import { Router } from 'express';
import * as adminController from './admin.controller.ts';
import authenticate from '../../middlewares/auth.middleware.ts';

const router = Router();

router.use(authenticate);

router.get('/users', adminController.getUsersHandler);
router.get('/analytics', adminController.getAnalyticsHandler);

export default router;
