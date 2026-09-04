import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, error, setSession, logout, fetchProfile } =
    useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    setSession,
    logout,
    fetchProfile,
    isAdmin: user?.role === 'ADMIN'
  };
};
