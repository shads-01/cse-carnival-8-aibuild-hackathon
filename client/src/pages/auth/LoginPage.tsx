import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { authService } from '../../services/authService';
import { supabaseClient } from '../../services/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { UserRole } from '@shared/types';
import { Mail, Lock, GraduationCap, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [roleTab, setRoleTab] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (loginEmail: string, loginPass?: string) => {
    setError(null);

    // Validate university edu domain
    if (!loginEmail.endsWith('.edu')) {
      setError('Please use your university email address (*.edu)');
      return;
    }

    setIsLoading(true);
    try {
      const session = await authService.login({
        email: loginEmail,
        password: loginPass !== undefined ? loginPass : password
      });
      setSession(session.user, session.token);
      toast.success(`Welcome back, ${session.user.name}!`);

      if (session.user.role === UserRole.ADMIN) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    handleLogin(email, password);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error: oauthError } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (oauthError) {
      toast.error(oauthError.message || 'Could not start Google sign-in.');
    }
    // On success the browser navigates away to Google, then back to /auth/callback.
  };

  return (
    <Card className="animate-slide-up" variant="elevated" style={{ width: '100%' }}>
      {/* Role Selector Tabs with Sliding Pill */}
      <div
        className="glass"
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden'
        }}
      >
        {/* Animated sliding indicator pill */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            bottom: '4px',
            left: '4px',
            width: 'calc(50% - 4px)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-gradient)',
            boxShadow: 'var(--shadow-glow)',
            transform: roleTab === 'student' ? 'translateX(0%)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        <button
          type="button"
          onClick={() => {
            setRoleTab('student');
            setEmail('student@campus.edu');
            setError(null);
          }}
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: roleTab === 'student' ? '#ffffff' : 'var(--text-secondary)',
            background: 'transparent',
            transition: 'color var(--transition-fast)'
          }}
        >
          <GraduationCap size={16} />
          <span>Student</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRoleTab('admin');
            setEmail('admin@campus.edu');
            setError(null);
          }}
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: roleTab === 'admin' ? '#ffffff' : 'var(--text-secondary)',
            background: 'transparent',
            transition: 'color var(--transition-fast)'
          }}
        >
          <ShieldAlert size={16} />
          <span>Admin / Staff</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {roleTab === 'student' ? 'Student Sign In' : 'Administrator Portal'}
        </h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Access your personalized academic operations dashboard
        </p>
      </div>

      {/* One-Tap Demo Credentials Card (Judge Fallback) */}
      <div
        className="glass"
        style={{
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 180, 216, 0.08)',
          border: '1px dashed var(--glass-border-hover)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Instant Demo Access
          </span>
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Button
            type="button"
            variant="glass"
            size="sm"
            onClick={() => handleLogin('student@campus.edu', 'student123')}
            style={{ fontSize: '0.78rem', padding: '6px 8px' }}
          >
            Student One-Tap
          </Button>
          <Button
            type="button"
            variant="glass"
            size="sm"
            onClick={() => handleLogin('admin@campus.edu', 'admin123')}
            style={{ fontSize: '0.78rem', padding: '6px 8px' }}
          >
            Admin One-Tap
          </Button>
        </div>
      </div>

      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="secondary"
        onClick={handleGoogleSignIn}
        style={{
          width: '100%',
          marginBottom: '1.25rem',
          height: '42px',
          background: 'var(--glass-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Sign in with Google (Edu)</span>
      </Button>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '0 0 1.25rem 0',
          color: 'var(--text-dim)',
          fontSize: '0.78rem'
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
        <span>OR VIA CREDENTIALS</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            fontSize: '0.84rem',
            marginBottom: '1rem',
            lineHeight: 1.4
          }}
        >
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input
          label="University Email"
          type="email"
          placeholder="id@campus.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
          required
        />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Password
            </label>
            <Link
              to="/forgot"
              style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}
            >
              Forgot?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          style={{ width: '100%', height: '42px', marginTop: '6px' }}
        >
          Sign In to CampusOS
        </Button>
      </form>

      {/* Footer Links */}
      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        New student or faculty?{' '}
        <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 700 }}>
          Create an account
        </Link>
      </div>
    </Card>
  );
};
