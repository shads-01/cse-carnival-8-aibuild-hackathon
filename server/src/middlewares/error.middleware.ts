import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { HttpStatus, ApiResponse } from '@shared/types';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  logger.error(err.message, { stack: err.stack });

  if (err instanceof ApiError) {
    const payload: ApiResponse = {
      success: false,
      message: err.message,
      error: err.errors as Record<string, unknown> | string,
      timestamp: new Date().toISOString()
    };
    return res.status(err.statusCode).json(payload);
  }

  const payload: ApiResponse = {
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  };

  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(payload);
};
