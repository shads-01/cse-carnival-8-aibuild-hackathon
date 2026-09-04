import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Sparkles, BookOpenCheck, Bot } from 'lucide-react';

export const StudentBottomTabs: React.FC = () => {
  const location = useLocation();

  const tabs = [
    { to: '/app', label: 'Home', icon: Home, end: true },
    { to: '/app/schedule', label: 'Schedule', icon: Calendar },
    { to: '/app/events', label: 'Events', icon: Sparkles },
    { to: '/app/assignments', label: 'Tasks', icon: BookOpenCheck },
    { to: '/app/chat', label: 'AI', icon: Bot, isAgent: true }
  ];

  const getActiveIndex = () => {
    const path = location.pathname;
    const index = tabs.findIndex(tab => tab.end ? path === tab.to : path.startsWith(tab.to));
    return index !== -1 ? index : 0;
  };

  const activeIndex = getActiveIndex();

  return (
    <nav
      className="glass-elevated student-bottom-bar"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: '12px',
        left: '12px',
        right: '12px',
        height: '60px',
        borderRadius: 'var(--radius-xl)',
        display: 'none',
        alignItems: 'center',
        zIndex: 90,
        padding: '0 6px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden'
      }}
    >
      {/* Sliding Active Pill Indicator */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          bottom: '6px',
          left: `calc(${activeIndex * 20}% + 4px)`,
          width: 'calc(20% - 8px)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--accent-muted)',
          border: '1px solid var(--glass-border-hover)',
          boxShadow: '0 0 16px var(--accent-glow)',
          transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              height: '100%',
              borderRadius: 'var(--radius-lg)',
              color: isActive ? 'var(--accent-hover)' : 'var(--text-dim)',
              transition: 'color var(--transition-fast)',
              position: 'relative',
              zIndex: 1,
              textDecoration: 'none'
            })}
          >
            <Icon size={20} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>
              {tab.label}
            </span>
          </NavLink>
        );
      })}

      <style>{`
        @media (max-width: 768px) {
          .student-bottom-bar {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
};

