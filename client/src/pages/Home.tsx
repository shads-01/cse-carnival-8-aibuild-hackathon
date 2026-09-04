import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ArrowRight, Layers, ShieldCheck, Zap, Server } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '20px',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          color: 'var(--accent-primary)',
          fontSize: '0.875rem',
          fontWeight: 700,
          marginBottom: '1.5rem'
        }}
      >
        <Zap size={16} /> Enterprise Scalable Architecture
      </div>

      <h1
        style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '1.5rem',
          maxWidth: '850px',
          margin: '0 auto 1.5rem auto'
        }}
      >
        Modern Full-Stack Project with{' '}
        <span className="gradient-text">TypeScript & Supabase</span>
      </h1>

      <p
        style={{
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          maxWidth: '650px',
          margin: '0 auto 2.5rem auto',
          lineHeight: 1.6
        }}
      >
        A clean, layered full-stack foundation separating frontend React components, backend Express services, Zod validation, and Supabase database integration.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
        <Link to="/dashboard">
          <Button variant="primary" size="lg">
            Explore Dashboard <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="secondary" size="lg">
            Sign In Demo
          </Button>
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          textAlign: 'left'
        }}
      >
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}
          >
            <Layers size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Feature-Based Frontend
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Logic encapsulated in feature modules (`auth`, `user`, `dashboard`) to maximize maintainability.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}
          >
            <Server size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Layered Express Architecture
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Controllers handle HTTP req/res while dedicated Services handle business logic and Supabase client calls.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Shared Types & Utilities
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Single source of truth for DTOs, HTTP status constants, and API interfaces across both client and server.
          </p>
        </div>
      </div>
    </div>
  );
};
