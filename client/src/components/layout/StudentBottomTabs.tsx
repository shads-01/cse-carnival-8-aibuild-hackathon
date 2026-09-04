import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Sparkles, BookOpenCheck, Bot } from 'lucide-react';

export const StudentBottomTabs: React.FC = () => {
  const tabs = [
    { to: '/app', label: 'Home', icon: Home, end: true },
    { to: '/app/schedule', label: 'Schedule', icon: Calendar },
    { to: '/app/events', label: 'Events', icon: Sparkles },
    { to: '/app/assignments', label: 'Tasks', icon: BookOpenCheck },
    { to: '/app/chat', label: 'AI', icon: Bot, isAgent: true }
  ];

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
        justifyContent: 'space-around',
        zIndex: 90,
        padding: '0 8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-lg)',
              color: isActive ? 'var(--accent)' : 'var(--text-dim)',
              transition: 'all var(--transition-fast)',
              position: 'relative'
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
