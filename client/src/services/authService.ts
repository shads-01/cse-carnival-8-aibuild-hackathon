import { apiClient } from './api';
import { LoginPayload, RegisterPayload, AuthSession, User, ApiResponse } from '@shared/types';

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', payload);
    if (!response.data.data) throw new Error('Invalid login response');
    const session = response.data.data;
    localStorage.setItem('auth_token', session.token);
    return session;
  },

  register: async (payload: RegisterPayload): Promise<AuthSession> => {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/register', payload);
    if (!response.data.data) throw new Error('Invalid registration response');
    const session = response.data.data;
    localStorage.setItem('auth_token', session.token);
    return session;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    if (!response.data.data) throw new Error('Failed to fetch profile');
    return response.data.data;
  },

  logout: (): void => {
    localStorage.removeItem('auth_token');
  }
};
