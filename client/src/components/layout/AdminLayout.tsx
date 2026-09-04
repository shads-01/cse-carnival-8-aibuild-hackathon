import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { NotificationBell } from '../common/NotificationBell';
import { ThemeToggle } from '../common/ThemeToggle';
import { Menu, X, ShieldAlert } from 'lucide-react';

const routeTitleMap: Record<string, { title: string; subtitle: string }> = {
  '/admin': { title: 'Operations Overview', subtitle: 'Live status across all university facilities and schedules' },
  '/admin/schedules': { title: 'Academic Schedules', subtitle: 'Manage courses, class routines, instructors and sections' },
  '/admin/rooms': { title: 'Rooms & Facilities', subtitle: 'Capacity planning, equipment specs, and space reservations' },
  '/admin/events': { title: 'Campus Events', subtitle: 'Workshops, hackathons, seminars and attendee registrations' },
  '/admin/announcements': { title: 'Announcements Board', subtitle: 'Campus broadcasts, circulars, and priority notifications' },
  '/admin/assignments': { title: 'Coursework & Assignments', subtitle: 'Track deadlines, assign submission portals and weights' },
  '/admin/requests': { title: 'Room Booking Approvals', subtitle: 'Review pending reservation requests and resolve conflicts' },
  '/admin/chat': { title: 'Campus AI Agent', subtitle: 'Autonomous natural language operations on live campus data' }
};

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentRoute = routeTitleMap[location.pathname] || {
    title: 'Admin Console',
    subtitle: 'Campus Operations Management'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
      {/* Desktop Sidebar */}
      <div style={{ display: 'none', minWidth: '260px' }} className="desktop-sidebar">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            backgroundColor: 'rgba(3, 8, 18, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex'
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{ width: '280px', height: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Navbar */}
        <header
          className="glass"
          style={{
            height: '68px',
            position: 'sticky',
            top: 0,
            zIndex: 80,
            borderRadius: 0,
            borderTop: 'none',
            borderRight: 'none',
            borderLeft: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-menu-btn glass"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                padding: 0
              }}
              aria-label="Toggle menu"
            >
              <Menu size={18} />
            </button>

            <div>
              <h1
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  margin: 0,
                  lineHeight: 1.2
                }}
              >
                {currentRoute.title}
              </h1>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  display: 'none'
                }}
                className="desktop-subtitle"
              >
                {currentRoute.subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        {(() => {
          const isChat = location.pathname.startsWith('/admin/chat');
          return (
            <main
              style={{
                flex: 1,
                padding: isChat ? 0 : '1.75rem 1.5rem',
                maxWidth: isChat ? '100%' : '1440px',
                width: '100%',
                margin: isChat ? 0 : '0 auto',
                animation: 'fadeIn 0.25s ease',
                display: isChat ? 'flex' : 'block',
                flexDirection: isChat ? 'column' : undefined,
                height: isChat ? 'calc(100vh - 68px)' : undefined,
                minHeight: 0,
                overflow: isChat ? 'hidden' : undefined
              }}
            >
              <Outlet />
            </main>
          );
        })()}
      </div>

      <style>{`
        @media (min-width: 900px) {
          .desktop-sidebar {
            display: block !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
          .desktop-subtitle {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};
