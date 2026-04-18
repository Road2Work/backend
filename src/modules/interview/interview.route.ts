import { Router } from 'express';
import * as interviewController from './interview.controller.ts';
import validate from '../../middlewares/validate.middleware.ts';
import authenticate from '../../middlewares/auth.middleware.ts';
import {
  startInterviewSchema,
  interviewIdParamSchema,
  sessionParamSchema,
  submitSessionSchema,
} from '../../validations/interview.validation.ts';

const router = Router();

// All interview routes require authentication
router.use(authenticate);

// Interview lifecycle
router.post('/', validate({ body: startInterviewSchema }), interviewController.startInterviewHandler);
router.get('/', interviewController.listInterviewsHandler);
router.get('/:id', validate({ params: interviewIdParamSchema }), interviewController.getInterviewDetailHandler);
router.get('/:id/result', validate({ params: interviewIdParamSchema }), interviewController.getInterviewResultHandler);

// Session management
router.post('/:id/sessions/:sessionId/start', validate({ params: sessionParamSchema }), interviewController.startSessionHandler);
router.post('/:id/sessions/:sessionId/submit', validate({ params: sessionParamSchema, body: submitSessionSchema }), interviewController.submitSessionHandler);

export default router;
