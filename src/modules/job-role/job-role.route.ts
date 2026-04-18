import { Router } from 'express';
import * as jobRoleController from './job-role.controller.ts';
import validate from '../../middlewares/validate.middleware.ts';
import { jobRoleIdParamSchema } from '../../validations/job-role.validation.ts';

const router = Router();

router.get('/', jobRoleController.listJobRolesHandler);
router.get('/:id', validate({ params: jobRoleIdParamSchema }), jobRoleController.getJobRoleDetailHandler);

export default router;
