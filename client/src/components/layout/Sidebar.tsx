import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, Shield } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const links = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/dashboard/users', label: 'Users Directory', icon: Users },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className="glass-panel"
      style={{
        width: '240px',
        minHeight: 'calc(100vh - 70px)',
        padding: '1.5rem 1rem',
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-dim)',
            padding: '0 0.75rem 0.5rem 0.75rem'
          }}
        >
          Navigation
        </span>

        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive ? 'var(--accent-gradient)' : 'transparent',
                transition: 'all 0.2s ease'
              })}
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
