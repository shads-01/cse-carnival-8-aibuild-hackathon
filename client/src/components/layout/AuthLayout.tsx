import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ThemeToggle } from '../common/ThemeToggle';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative'
      }}
    >
      {/* Top action bar */}
      <header
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            C
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }} className="gradient-text">
              CampusOS
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em' }}>
              ACADEMIC INTELLIGENCE
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Form Container */}
      <main
        style={{
          width: '100%',
          maxWidth: '460px',
          margin: 'auto 0',
          paddingTop: '60px',
          paddingBottom: '40px'
        }}
      >
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        style={{
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
        <span>Unified University Management · Encrypted Edu-Domain Session</span>
      </footer>
    </div>
  );
};
