import type { Response } from 'express';

interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T | null;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details: any;
  };
}

/**
 * Send a standardized success response matching the API Contract.
 */
const response = <T = any>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a standardized error response matching the API Contract.
 */
export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errorCode: string = 'UNKNOWN_ERROR',
  details: any = null,
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode,
      details,
    },
  });
};

export default response;
