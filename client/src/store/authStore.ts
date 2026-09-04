import { create } from 'zustand';
import { User } from '@shared/types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setSession: (user: User, token: string) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

const getInitialUser = (): User | null => {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,

  setSession: (user: User, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, error: null });
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  fetchProfile: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Session expired';
      const existingUser = getInitialUser();
      // If we already have a cached user, keep it instead of failing immediately
      if (existingUser) {
        set({ user: existingUser, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: errorMsg });
      }
    }
  }
}));
