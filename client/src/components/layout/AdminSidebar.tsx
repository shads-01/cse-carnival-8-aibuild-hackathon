import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Sparkles,
  Megaphone,
  BookOpenCheck,
  Inbox,
  Bot,
  LogOut,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AdminSidebarProps {
  pendingRequestsCount?: number;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pendingRequestsCount = 2,
  onCloseMobile
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/schedules', label: 'Schedules', icon: Calendar },
    { to: '/admin/rooms', label: 'Rooms & Spaces', icon: Building2 },
    { to: '/admin/events', label: 'Events & Workshops', icon: Sparkles },
    { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/admin/assignments', label: 'Assignments', icon: BookOpenCheck },
    {
      to: '/admin/requests',
      label: 'Room Requests',
      icon: Inbox,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined
    },
    {
      to: '/admin/chat',
      label: 'AI Operator',
      icon: Bot,
      isAgent: true
    }
  ];

  return (
    <aside
      className="glass"
      style={{
        width: '260px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        padding: '1.25rem 1rem',
        zIndex: 90
      }}
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 0.5rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.1rem',
              boxShadow: 'var(--shadow-glow)',
              flexShrink: 0
            }}
          >
            C
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }} className="gradient-text">
              CampusOS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <ShieldCheck size={12} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                ADMIN CONSOLE
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.5rem 0.6rem 0.25rem'
            }}
          >
            Management
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive
                    ? item.isAgent
                      ? 'linear-gradient(135deg, #0077b6, #00b4d8)'
                      : 'var(--accent-gradient)'
                    : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                  transition: 'all var(--transition-fast)'
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    style={{
                      backgroundColor: 'var(--warning)',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 7px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)'
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {item.isAgent && (
                  <span
                    style={{
                      backgroundColor: 'rgba(0, 180, 216, 0.2)',
                      color: 'var(--accent)',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 6px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      border: '1px solid var(--accent-muted)'
                    }}
                  >
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Card & Logout Footer */}
      <div
        style={{
          borderTop: '1px solid var(--glass-border)',
          paddingTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--glass-bg)'
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--accent-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              flexShrink: 0
            }}
          >
            <UserIcon size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {user?.name || 'Administrator'}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {user?.email || 'admin@campus.edu'}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
