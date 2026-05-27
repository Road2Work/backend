import type { NextFunction, Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.ts';
import response from '../../utils/response.ts';
import { verifyUserCredential, createUser, getUserById, checkEmailExists } from '../user/user.service.ts';
import ApiError from '../../utils/ApiError.ts';
import { generateAccessTokenHelper, generateRefreshTokenHelper, verifyRefreshTokenHelper } from '../../utils/token.ts';
import { addRefreshToken, deleteRefreshToken, verifyAndRefreshToken } from './auth.service.ts';

export const signupHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  const isEmailExist = await checkEmailExists(email);
  if (isEmailExist) {
    return next(ApiError.conflict('Email already registered', 'AUTH_EMAIL_ALREADY_EXISTS'));
  }

  const user = await createUser({ email, password, fullname: name });

  if (!user) {
    return next(ApiError.internal('Failed to create account'));
  }

  const accessToken = generateAccessTokenHelper({ id: user.id });

  return response(res, 201, 'Account created successfully', {
    user: {
      id: user.id,
      name: user.fullname,
      email: user.email,
      createdAt: user.createdAt,
    },
    accessToken,
  });
});

export const loginHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const userId = await verifyUserCredential({ email, password });

  if (!userId) {
    return next(ApiError.unauthorized('Invalid email or password', 'AUTH_INVALID_CREDENTIALS'));
  }

  const user = await getUserById(userId);

  const accessToken = generateAccessTokenHelper({ id: userId });
  const refreshToken = generateRefreshTokenHelper({ id: userId });

  await addRefreshToken({ userId, refreshToken });

  return response(res, 200, 'Login successful', {
    user: user
      ? {
        id: user.id,
        name: user.fullname,
        email: user.email,
        createdAt: user.createdAt,
      }
      : null,
    accessToken,
    refreshToken,
  });
});

export const getMeHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;

  const user = await getUserById(userId);

  if (!user) {
    return next(ApiError.notFound('User not found'));
  }

  return response(res, 200, 'Current user fetched successfully', {
    user: {
      id: user.id,
      name: user.fullname,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

export const refreshTokenHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(ApiError.badRequest('Refresh token is required'));
    }

    const storedToken = await verifyAndRefreshToken({ refreshToken });

    if (!storedToken) {
      return next(ApiError.badRequest('Invalid or expired refresh token'));
    }

    const payload = verifyRefreshTokenHelper(refreshToken);

    if (payload.id !== storedToken.userId) {
      return next(ApiError.badRequest('Refresh token tidak valid'));
    }

    const newAccessToken = generateAccessTokenHelper({ id: payload.id });

    return response(res, 200, 'Access Token berhasil diperbarui', {
      accessToken: newAccessToken,
    });
  }
);

export const logoutHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(ApiError.badRequest('Refresh token is required'));
    }

    const storedToken = await verifyAndRefreshToken({ refreshToken });

    if (!storedToken) {
      return next(ApiError.badRequest('Refresh token tidak valid atau kadaluarsa'));
    }

    await deleteRefreshToken({ refreshToken });

    return response(res, 200, 'Logout berhasil', null);
  }
);
