import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  Calendar,
  Sparkles,
  Megaphone,
  BookOpenCheck,
  Clock,
  Bot,
  LogOut,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../common/NotificationBell';
import { ThemeToggle } from '../common/ThemeToggle';

export const StudentNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const studentLinks = [
    { to: '/app', label: 'Home', icon: Home, end: true },
    { to: '/app/schedule', label: 'Schedule', icon: Calendar },
    { to: '/app/events', label: 'Events', icon: Sparkles },
    { to: '/app/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/app/assignments', label: 'Assignments', icon: BookOpenCheck },
    { to: '/app/activity', label: 'My Activity', icon: Clock },
    { to: '/app/chat', label: 'AI Assistant', icon: Bot, isAgent: true }
  ];

  return (
    <>
      <header
        className="glass"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderRadius: 0,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          height: '66px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem'
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/app" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#ffffff',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              C
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }} className="gradient-text">
                CampusOS
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                STUDENT PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '4px'
          }}
          className="student-desktop-nav"
        >
          {studentLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                  transition: 'all var(--transition-fast)'
                })}
              >
                <Icon size={16} />
                <span>{link.label}</span>
                {link.isAgent && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(0, 180, 216, 0.25)',
                      color: '#ffffff'
                    }}
                  >
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right User & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationBell />
          <ThemeToggle />

          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 4px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)'
            }}
            className="student-user-pill"
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--accent-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)'
              }}
            >
              <UserIcon size={15} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Student'}
            </span>
            <button
              onClick={logout}
              title="Sign out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                padding: '2px'
              }}
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="student-mobile-menu-btn glass"
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Menu size={18} />
          </button>
        </div>

        <style>{`
          @media (min-width: 900px) {
            .student-desktop-nav {
              display: flex !important;
            }
            .student-user-pill {
              display: flex !important;
            }
            .student-mobile-menu-btn {
              display: none !important;
            }
          }
        `}</style>
      </header>

      {/* Mobile drawer — portaled to body so backdrop-filter on header doesn't break position:fixed */}
      {mobileDrawerOpen && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(3, 8, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            style={{
              width: '280px',
              height: '100%',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--bg-solid)',
              borderLeft: '1px solid var(--glass-border-hover)',
              boxShadow: 'var(--shadow-elevated)',
              animation: 'slideInRight 0.25s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }} className="gradient-text">Menu</span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {studentLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      onClick={() => setMobileDrawerOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.92rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#ffffff' : 'var(--text-primary)',
                        background: isActive ? 'var(--accent-gradient)' : 'transparent'
                      })}
                    >
                      <Icon size={18} />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
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
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
