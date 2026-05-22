import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as profileController from './profile.controller.ts';
import validate from '../../middlewares/validate.middleware.ts';
import authenticate from '../../middlewares/auth.middleware.ts';
import {
  createProfileSchema,
  profileIdParamSchema,
  submitShortProfileSchema,
} from '../../validations/profile.validation.ts';

const cvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve('uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `cv-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate({ body: createProfileSchema }),
  profileController.createProfileHandler,
);

router.get(
  '/:profileId',
  validate({ params: profileIdParamSchema }),
  profileController.getProfileHandler,
);

router.post(
  '/:profileId/cv',
  validate({ params: profileIdParamSchema }),
  uploadCV.single('cvFile'),
  profileController.uploadCvHandler,
);

router.post(
  '/:profileId/context',
  validate({ params: profileIdParamSchema, body: submitShortProfileSchema }),
  profileController.submitShortProfileHandler,
);

export default router;
