import { Router } from 'express';
import * as userController from '../controllers/user.controller.ts';
import validate from '../middlewares/validate.middleware.ts';
import { registerSchema } from '../validations/user.validation.ts';
import { idParamSchema } from '../validations/common.validation.ts';

const router = Router();

router.post('/', validate({ body: registerSchema }), userController.createUserHandler);
router.get('/:id', validate({ params: idParamSchema }), userController.getUserByIdHandler);

export default router;
