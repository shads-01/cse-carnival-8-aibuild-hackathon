import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendResponse } from '../utils/apiResponse';
import { HttpStatus } from '@shared/types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const session = await this.authService.login(req.body);
    sendResponse(res, HttpStatus.OK, 'Login successful', session);
  };

  register = async (req: Request, res: Response): Promise<void> => {
    const session = await this.authService.register(req.body);
    sendResponse(res, HttpStatus.CREATED, 'User registration successful', session);
  };

  oauthCallback = async (req: Request, res: Response): Promise<void> => {
    const session = await this.authService.loginWithGoogle(req.body.accessToken);
    sendResponse(res, HttpStatus.OK, 'Google sign-in successful', session);
  };

  getMe = async (req: Request, res: Response): Promise<void> => {
    sendResponse(res, HttpStatus.OK, 'Current user profile fetched successfully', req.user);
  };
}
