import { Router } from 'express';
import * as roleFitController from './role-fit.controller.ts';
import authenticate from '../../middlewares/auth.middleware.ts';

const router = Router();

router.use(authenticate);

router.post('/generate-ranking', roleFitController.generateRankingHandler);
router.post('/score', roleFitController.scoreHandler);
router.post('/confirm', roleFitController.confirmHandler);

export default router;
