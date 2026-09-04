import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { LoginPayload, RegisterPayload, AuthSession } from '@shared/types';
import { UserService } from './user.service';
import { ApiError } from '../utils/apiResponse';
import { config } from '../config';
import { supabase } from '../config/supabase';

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

  /**
   * Exchanges a verified Supabase session (from a client-side Google OAuth
   * sign-in via supabase.auth.signInWithOAuth) for our own custom JWT.
   * Finds-or-creates the matching public.users row by email so every other
   * route/middleware keeps treating this exactly like a normal login.
   */
  async loginWithGoogle(accessToken: string): Promise<AuthSession> {
    if (!accessToken) {
      throw ApiError.badRequest('Supabase access token is required');
    }

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user?.email) {
      throw ApiError.unauthorized('Invalid or expired Google session');
    }

    const googleUser = data.user;
    const email = googleUser.email!.toLowerCase().trim();
    const name =
      googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || email.split('@')[0];
    const avatarUrl = googleUser.user_metadata?.avatar_url || googleUser.user_metadata?.picture;

    let user = await this.userService.getUserByEmail(email);
    if (!user) {
      // Unguessable placeholder hash — this account can never log in via password.
      const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      user = await this.userService.createUser({
        email,
        name,
        avatarUrl,
        passwordHash: randomPasswordHash
      });
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
}
