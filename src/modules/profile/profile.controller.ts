import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync.ts';
import response from '../../utils/response.ts';
import ApiError from '../../utils/ApiError.ts';
import {
  createProfile,
  getProfileById,
  processCV,
  processShortProfile,
} from './profile.service.ts';

export const createProfileHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const { targetRoleId } = req.body;

  const result = await createProfile(userId, targetRoleId);

  if ('error' in result && result.error === 'ROLE_NOT_FOUND') {
    return next(ApiError.notFound(result.message, 'ROLE_NOT_FOUND'));
  }

  return response(res, 201, 'Profile created successfully', result);
});

export const getProfileHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const profileId = req.params.profileId as string;

  const result = await getProfileById(profileId, userId);

  if (!result) {
    return next(ApiError.notFound('Profile not found', 'PROFILE_NOT_FOUND'));
  }

  return response(res, 200, 'Profile fetched successfully', result);
});

export const uploadCvHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const profileId = req.params.profileId as string;

  if (!req.file) {
    return next(ApiError.badRequest('CV file is required', 'CV_INVALID_FORMAT'));
  }

  if (req.file.mimetype !== 'application/pdf') {
    return next(ApiError.badRequest('Invalid file format. Only PDF is allowed.', 'CV_INVALID_FORMAT'));
  }
  const maxSize = 5 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return next(ApiError.badRequest('File CV is too large. Max 5MB.', 'CV_FILE_TOO_LARGE'));
  }

  const result = await processCV(profileId, userId, req.file.path, req.file.originalname);

  if ('error' in result && result.error === 'PROFILE_NOT_FOUND') {
    return next(ApiError.notFound(result.message, 'PROFILE_NOT_FOUND'));
  }

  return response(res, 200, 'CV processed successfully', result);
});

export const submitShortProfileHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const profileId = req.params.profileId as string;

  const result = await processShortProfile(profileId, userId, req.body);

  if ('error' in result && result.error === 'PROFILE_NOT_FOUND') {
    return next(ApiError.notFound(result.message, 'PROFILE_NOT_FOUND'));
  }

  return response(res, 200, 'Short profile processed successfully', result);
});
