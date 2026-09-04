import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';
import { LogOut, User as UserIcon, LayoutDashboard, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header
      className="glass-panel"
      style={{
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#fff'
          }}
        >
          C
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800 }} className="gradient-text">
          CampusOS
        </span>
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
          <Home size={18} /> Home
        </Link>

        {isAuthenticated && (
          <Link
            to="/dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </Link>
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserIcon size={18} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={logout}>
              <LogOut size={16} style={{ marginRight: '6px' }} /> Logout
            </Button>
          </div>
        ) : (
          <Link to="/login">
            <Button variant="primary" size="sm">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
