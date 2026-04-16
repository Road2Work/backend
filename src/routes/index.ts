import { Router } from 'express';

import userRoutes from './user.route.ts';
import companyRoutes from './company.route.ts';
import categoryRoutes from './category.route.ts';
import jobRoutes from './job.route.ts';
import authRoutes from './auth.route.ts';
import documentRoutes from './document.route.ts';
import profileRoutes from './profile.route.ts';
import applicationRoutes from './application.route.ts';
import bookmarkRoutes from './bookmark.route.ts';

const router = Router();

router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/categories', categoryRoutes);
router.use('/jobs', jobRoutes);
router.use('/authentications', authRoutes);
router.use('/documents', documentRoutes);
router.use('/profile', profileRoutes);
router.use('/applications', applicationRoutes);
router.use('/bookmarks', bookmarkRoutes);

export default router;