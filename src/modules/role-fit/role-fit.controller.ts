import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync.ts';
import response from '../../utils/response.ts';
import ApiError from '../../utils/ApiError.ts';
import { getRoleFitRanking, getRoleFitScore, confirmRoleFit } from './role-fit.service.ts';

export const generateRankingHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const { profileId } = req.body;

  if (!profileId) return next(ApiError.badRequest('profileId is required'));

  const result = await getRoleFitRanking(userId, profileId);

  if ('error' in result && result.error) {
    const statusMap: Record<string, number> = {
      PROFILE_NOT_FOUND: 404,
      ROLE_FIT_RANKING_CV_ONLY: 400,
    };
    return next(new ApiError(result.message, statusMap[result.error] || 400, result.error));
  }

  return response(res, 200, 'Role fit ranking generated successfully', result);
});

export const scoreHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const { profileId, roleId } = req.body;

  if (!profileId) return next(ApiError.badRequest('profileId is required'));
  if (!roleId) return next(ApiError.badRequest('roleId is required'));

  const result = await getRoleFitScore(userId, profileId, roleId);

  if ('error' in result && result.error) {
    const statusMap: Record<string, number> = {
      PROFILE_NOT_FOUND: 404,
      ROLE_NOT_FOUND: 404,
    };
    return next(new ApiError(result.message, statusMap[result.error] || 400, result.error));
  }

  return response(res, 200, 'Role fit score calculated successfully', result);
});

export const confirmHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const { profileId, roleId } = req.body;

  if (!profileId) return next(ApiError.badRequest('profileId is required'));
  if (!roleId) return next(ApiError.badRequest('roleId is required'));

  const result = await confirmRoleFit(userId, profileId, roleId);

  if ('error' in result && result.error) {
    const statusMap: Record<string, number> = {
      PROFILE_NOT_FOUND: 404,
      ROLE_NOT_FOUND: 404,
    };
    return next(new ApiError(result.message, statusMap[result.error] || 400, result.error));
  }

  return response(res, 200, 'Role confirmed successfully', result);
});
