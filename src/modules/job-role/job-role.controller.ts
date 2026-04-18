import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync.ts';
import response from '../../utils/response.ts';
import ApiError from '../../utils/ApiError.ts';
import { getAllJobRoles, getJobRoleById } from './job-role.service.ts';

export const listJobRolesHandler = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
  const roles = await getAllJobRoles();
  return response(res, 200, 'Job roles fetched successfully', roles);
});

export const getJobRoleDetailHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const role = await getJobRoleById(id);

  if (!role) {
    return next(ApiError.notFound('Job role not found'));
  }

  return response(res, 200, 'Job role detail fetched successfully', role);
});
