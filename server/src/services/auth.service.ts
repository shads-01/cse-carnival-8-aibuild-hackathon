import jwt from 'jsonwebtoken';
import { LoginPayload, RegisterPayload, AuthSession } from '@shared/types';
import { UserService } from './user.service';
import { ApiError } from '../utils/apiResponse';
import { config } from '../config';

export class AuthService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async login(payload: LoginPayload): Promise<AuthSession> {
    const user = await this.userService.getUserByEmail(payload.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password credentials');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      token,
      user,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };
  }

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const existing = await this.userService.getUserByEmail(payload.email);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const user = await this.userService.createUser({
      email: payload.email,
      name: payload.name,
      password: payload.password
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      token,
      user,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };
  }
}
