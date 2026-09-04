import { apiClient } from './api';
import { LoginPayload, RegisterPayload, AuthSession, User, ApiResponse } from '@shared/types';

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthSession> => {
    try {
      const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', payload);
      if (!response.data.data) {
        throw new Error(response.data.message || 'Invalid login response');
      }
      const session = response.data.data;
      localStorage.setItem('auth_token', session.token);
      localStorage.setItem('auth_user', JSON.stringify(session.user));
      return session;
    } catch (err: any) {
      // If error came from backend with 400/401/409/etc status, throw actual error
      throw err;
    }
  },

  register: async (payload: RegisterPayload): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/register', payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Invalid registration response');
    }
    const session = response.data.data;
    localStorage.setItem('auth_token', session.token);
    localStorage.setItem('auth_user', JSON.stringify(session.user));
    return session;
  },

  loginWithGoogle: async (accessToken: string): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/oauth/callback', {
      accessToken
    });
    if (!response.data.data) {
      throw new Error(response.data.message || 'Google sign-in failed');
    }
    const session = response.data.data;
    localStorage.setItem('auth_token', session.token);
    localStorage.setItem('auth_user', JSON.stringify(session.user));
    return session;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    if (!response.data.data) {
      throw new Error('Failed to fetch profile');
    }
    localStorage.setItem('auth_user', JSON.stringify(response.data.data));
    return response.data.data;
  },

  logout: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
};
