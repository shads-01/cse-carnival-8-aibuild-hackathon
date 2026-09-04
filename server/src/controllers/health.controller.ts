import { Request, Response } from 'express';
import { sendResponse } from '../utils/apiResponse';
import { HttpStatus } from '@shared/types';

export const getHealth = (_req: Request, res: Response): void => {
  sendResponse(res, HttpStatus.OK, 'Server health check passed', {
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
};
