import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync.ts';
import response from '../../utils/response.ts';
import ApiError from '../../utils/ApiError.ts';
import { getAllJobRoles, getJobRoleById } from './job-role.service.ts';

export const listJobRolesHandler = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const roleFamily = req.query.roleFamily as string | undefined;
  const roles = await getAllJobRoles(roleFamily);
  return response(res, 200, 'Roles fetched successfully', roles);
});

export const getJobRoleDetailHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const role = await getJobRoleById(id);

  if (!role) {
    return next(ApiError.notFound('Role not found', 'ROLE_NOT_FOUND'));
  }

  return response(res, 200, 'Role detail fetched successfully', role);
});
