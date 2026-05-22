import { Router } from 'express';

import userRoutes from '../modules/user/user.route.ts';
import authRoutes from '../modules/auth/auth.route.ts';
import jobRoleRoutes from '../modules/job-role/job-role.route.ts';
import profileRoutes from '../modules/profile/profile.route.ts';
import interviewRoutes from '../modules/interview/interview.route.ts';

const router = Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/roles', jobRoleRoutes);
router.use('/profiles', profileRoutes);
router.use('/interviews', interviewRoutes);

export default router;