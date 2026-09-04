import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'USER';
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children }) => {
  // Allow direct viewing of all pages without redirecting to login
  return <>{children}</>;
};

export const SmartRedirect: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to={isAdmin ? '/admin' : '/app'} replace />;
};
