import { Response } from 'express';
import { ApiResponse, HttpStatus, HttpStatusCode } from '@shared/types';

export class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errors?: unknown;

  constructor(statusCode: HttpStatusCode, message: string, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: unknown): ApiError {
    return new ApiError(HttpStatus.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Unauthorized access'): ApiError {
    return new ApiError(HttpStatus.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden resource access'): ApiError {
    return new ApiError(HttpStatus.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(HttpStatus.NOT_FOUND, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(HttpStatus.CONFLICT, message);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

export const sendResponse = <T>(
  res: Response,
  statusCode: HttpStatusCode,
  message: string,
  data?: T
): Response => {
  const payload: ApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(payload);
};
