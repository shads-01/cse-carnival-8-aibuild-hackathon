import { useAuthStore } from '../store/authStore';
import { UserRole } from '@shared/types';

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, error, setSession, logout, fetchProfile } =
    useAuthStore();

  const isAdmin = user?.role === UserRole.ADMIN;
  const isStudent = !isAdmin;

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    setSession,
    logout,
    fetchProfile,
    isAdmin,
    isStudent,
    role: user?.role || UserRole.USER
  };
};
