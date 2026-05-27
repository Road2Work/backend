import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync.ts';
import response from '../../utils/response.ts';
import { getUsers, getAnalytics } from './admin.service.ts';

export const getUsersHandler = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
  const result = await getUsers();
  return response(res, 200, 'Users fetched successfully', result);
});

export const getAnalyticsHandler = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
  const result = await getAnalytics();
  return response(res, 200, 'Analytics fetched successfully', result);
});
