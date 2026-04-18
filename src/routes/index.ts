import { Router } from 'express';

import userRoutes from '../modules/user/user.route.ts';
import authRoutes from '../modules/auth/auth.route.ts';
import jobRoleRoutes from '../modules/job-role/job-role.route.ts';
import interviewRoutes from '../modules/interview/interview.route.ts';

const router = Router();

router.use('/users', userRoutes);
router.use('/authentications', authRoutes);
router.use('/job-roles', jobRoleRoutes);
router.use('/interviews', interviewRoutes);

export default router;