import { Router } from 'express';

import userRoutes from '../modules/user/user.route.ts';
import authRoutes from '../modules/auth/auth.route.ts';
import jobRoleRoutes from '../modules/job-role/job-role.route.ts';
import profileRoutes from '../modules/profile/profile.route.ts';
import interviewRoutes from '../modules/interview/interview.route.ts';
import roleFitRoutes from '../modules/role-fit/role-fit.route.ts';
import dashboardRoutes from '../modules/dashboard/dashboard.route.ts';
import adminRoutes from '../modules/admin/admin.route.ts';

const router = Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/roles', jobRoleRoutes);
router.use('/profiles', profileRoutes);
router.use('/interviews', interviewRoutes);
router.use('/role-fit', roleFitRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);

export default router;