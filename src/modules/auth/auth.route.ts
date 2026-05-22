import { Router } from 'express';
import * as authController from './auth.controller.ts';
import validate from '../../middlewares/validate.middleware.ts';
import authenticate from '../../middlewares/auth.middleware.ts';
import { signupSchema, loginSchema, refreshTokenSchema } from '../../validations/auth.validation.ts';

const router = Router();

router.post('/signup', validate({ body: signupSchema }), authController.signupHandler);
router.post('/login', validate({ body: loginSchema }), authController.loginHandler);
router.get('/me', authenticate, authController.getMeHandler);

export default router;
