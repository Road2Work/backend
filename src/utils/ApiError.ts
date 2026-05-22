class ApiError extends Error {
  statusCode: number;
  errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, errorCode?: string): ApiError {
    return new ApiError(message, 400, errorCode);
  }

  static unauthorized(message: string = 'Unauthorized', errorCode?: string): ApiError {
    return new ApiError(message, 401, errorCode || 'AUTH_UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden', errorCode?: string): ApiError {
    return new ApiError(message, 403, errorCode);
  }

  static notFound(message: string = 'Resource not found', errorCode?: string): ApiError {
    return new ApiError(message, 404, errorCode);
  }

  static conflict(message: string, errorCode?: string): ApiError {
    return new ApiError(message, 409, errorCode);
  }

  static internal(message: string = 'Internal Server Error', errorCode?: string): ApiError {
    return new ApiError(message, 500, errorCode);
  }

  static serviceUnavailable(message: string = 'Service Unavailable', errorCode?: string): ApiError {
    return new ApiError(message, 503, errorCode || 'AI_SERVICE_UNAVAILABLE');
  }
}

export default ApiError;
