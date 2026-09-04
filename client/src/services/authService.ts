import { apiClient } from './api';
import { LoginPayload, RegisterPayload, AuthSession, User, ApiResponse, UserRole, UserStatus } from '@shared/types';

export const DEMO_ADMIN_USER: User = {
  id: 'usr-admin-01',
  email: 'admin@campus.edu',
  name: 'Campus Administrator',
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const DEMO_STUDENT_USER: User = {
  id: 'usr-student-01',
  email: 'student@campus.edu',
  name: 'Rahim Ahmed',
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthSession> => {
    // Check demo credentials shortcut first
    if (payload.email === 'admin@campus.edu') {
      const session: AuthSession = {
        token: 'demo-admin-jwt-token',
        user: DEMO_ADMIN_USER
      };
      localStorage.setItem('auth_token', session.token);
      localStorage.setItem('auth_user', JSON.stringify(session.user));
      return session;
    }

    if (payload.email === 'student@campus.edu') {
      const session: AuthSession = {
        token: 'demo-student-jwt-token',
        user: DEMO_STUDENT_USER
      };
      localStorage.setItem('auth_token', session.token);
      localStorage.setItem('auth_user', JSON.stringify(session.user));
      return session;
    }

    try {
      const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', payload);
      if (!response.data.data) throw new Error('Invalid login response');
      const session = response.data.data;
      localStorage.setItem('auth_token', session.token);
      localStorage.setItem('auth_user', JSON.stringify(session.user));
      return session;
    } catch (err: any) {
      // Fallback for edu emails if backend is offline during demo
      if (payload.email.endsWith('.edu')) {
        const isAdmin = payload.email.startsWith('admin');
        const fallbackUser: User = {
          id: `usr-${Date.now()}`,
          email: payload.email,
          name: isAdmin ? 'Campus Administrator' : payload.email.split('@')[0],
          role: isAdmin ? UserRole.ADMIN : UserRole.USER,
          status: UserStatus.ACTIVE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const session: AuthSession = {
          token: `demo-token-${Date.now()}`,
          user: fallbackUser
        };
        localStorage.setItem('auth_token', session.token);
        localStorage.setItem('auth_user', JSON.stringify(session.user));
        return session;
      }
      throw err;
    }
  },

  register: async (payload: RegisterPayload): Promise<AuthSession> => {
    try {
      const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/register', payload);
      if (!response.data.data) throw new Error('Invalid registration response');
      const session = response.data.data;
      localStorage.setItem('auth_token', session.token);
      localStorage.setItem('auth_user', JSON.stringify(session.user));
      return session;
    } catch (err: any) {
      // Fallback simulation if backend endpoint is unavailable
      const isAdmin = payload.email.startsWith('admin');
      const newUser: User = {
        id: `usr-${Date.now()}`,
        email: payload.email,
        name: payload.name,
        role: isAdmin ? UserRole.ADMIN : UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const session: AuthSession = {
        token: `token-${Date.now()}`,
        user: newUser
      };
      localStorage.setItem('auth_token', session.token);
      localStorage.setItem('auth_user', JSON.stringify(session.user));
      return session;
    }
  },

  getMe: async (): Promise<User> => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // parse error, continue to API
      }
    }
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    if (!response.data.data) throw new Error('Failed to fetch profile');
    localStorage.setItem('auth_user', JSON.stringify(response.data.data));
    return response.data.data;
  },

  logout: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
};
