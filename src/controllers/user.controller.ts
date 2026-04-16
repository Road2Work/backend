import type { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.ts';
import response from '../utils/response.ts';
import { createUser, verifyNewEmail, getUserById } from '../services/user.service.ts';
import ApiError from '../utils/ApiError.ts';

export const createUserHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role } = req.body;

  const isEmailExist = await verifyNewEmail(email);

  if (isEmailExist) {
    return next(ApiError.badRequest('Email already exists'));
  }

  const newUser = await createUser({ name, email, password, role });

  if (!newUser) {
    return next(ApiError.internal('Failed to create user'));
  }

  return response(res, 201, 'User registered successfully', newUser);
});

export const getUserByIdHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;

  const user = await getUserById(id);

  if (!user) {
    return next(ApiError.notFound('User not found'))
  }

  return response(res, 200, 'User retrieved successfully', user);
});
