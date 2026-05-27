import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as interviewController from './interview.controller.ts';
import validate from '../../middlewares/validate.middleware.ts';
import authenticate from '../../middlewares/auth.middleware.ts';
import {
  createSessionSchema,
  sessionIdParamSchema,
} from '../../validations/interview.validation.ts';

const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve('uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.use(authenticate);

router.post(
  '/sessions',
  validate({ body: createSessionSchema }),
  interviewController.createSessionHandler,
);

router.get(
  '/sessions/:sessionId',
  validate({ params: sessionIdParamSchema }),
  interviewController.getSessionDetailHandler,
);

router.post(
  '/sessions/:sessionId/voice-answer',
  validate({ params: sessionIdParamSchema }),
  uploadAudio.single('audioFile'),
  interviewController.submitVoiceAnswerHandler,
);

router.patch(
  '/sessions/:sessionId/cancel',
  validate({ params: sessionIdParamSchema }),
  interviewController.cancelSessionHandler,
);

router.get(
  '/sessions/:sessionId/result',
  validate({ params: sessionIdParamSchema }),
  interviewController.getResultHandler,
);

router.get(
  '/history',
  interviewController.getHistoryHandler,
);

router.get(
  '/quota',
  interviewController.getQuotaHandler,
);

router.get(
  '/practice-memory',
  interviewController.getPracticeMemoryHandler,
);

export default router;
