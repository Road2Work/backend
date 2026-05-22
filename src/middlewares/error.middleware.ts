import type { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError.ts';
import env from '../config/env.ts';

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.errorCode || 'UNKNOWN_ERROR',
        details: null,
      },
    });
  }

  console.error('Unhandled error:', err);

  const statusCode = 500;
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      details: null,
    },
  });
};

export default errorHandler;
