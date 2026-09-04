import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
    if (!payload.email || !payload.password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const userWithPass = await this.userService.getUserByEmailWithPassword(payload.email);
    if (!userWithPass || !userWithPass.passwordHash) {
      throw ApiError.unauthorized('Invalid email or password credentials');
    }

    const isPasswordValid = await bcrypt.compare(payload.password, userWithPass.passwordHash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password credentials');
    }

    const { passwordHash: _, ...user } = userWithPass;

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
    if (!payload.email || !payload.password || !payload.name) {
      throw ApiError.badRequest('Email, name, and password are required');
    }

    const existing = await this.userService.getUserByEmail(payload.email);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const user = await this.userService.createUser({
      email: payload.email,
      name: payload.name,
      passwordHash
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
