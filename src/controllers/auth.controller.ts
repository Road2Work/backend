import type { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.ts';
import response from '../utils/response.ts';
import { verifyUserCredential } from '../services/user.service.ts';
import ApiError from '../utils/ApiError.ts';
import { generateAccessTokenHelper, generateRefreshTokenHelper, verifyRefreshTokenHelper } from '../utils/token.ts';
import { addRefreshToken, deleteRefreshToken, verifyAndRefreshToken } from '../services/auth.service.ts';

export const loginHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const userId = await verifyUserCredential({ email, password });

  if (!userId) {
    return next(ApiError.unauthorized('Invalid credentials'));
  }

  const accessToken = generateAccessTokenHelper({ id: userId });
  const refreshToken = generateRefreshTokenHelper({ id: userId });

  await addRefreshToken({ userId, refreshToken });

  return response(res, 200, 'Login successful', {
    accessToken,
    refreshToken
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

    if (payload.id !== storedToken.user_id) {
      return next(ApiError.badRequest('Invalid refresh token'));
    }

    const newAccessToken = generateAccessTokenHelper({ id: payload.id });

    return response(res, 200, 'Token refreshed successfully', {
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
      return next(ApiError.badRequest('Invalid or expired refresh token'));
    }

    await deleteRefreshToken({ refreshToken });

    return response(res, 200, 'Logout successful', null);
  }
);
