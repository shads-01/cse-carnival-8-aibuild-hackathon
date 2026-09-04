import { User } from './user.types';

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  name: string;
  studentId?: string;
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  user: User;
  expiresAt?: number;
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
