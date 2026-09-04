import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { OtpFlow } from '../../components/auth/OtpFlow';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { Mail, Lock, User, BadgeCheck, ArrowLeft, CheckCircle } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'profile'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setSession } = useAuthStore();
  const navigate = useNavigate();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your university email');
      return;
    }
    if (!email.endsWith('.edu')) {
      setError('Sign up requires an institutional university email (*.edu)');
      return;
    }
    setStep('otp');
    toast.info(`Verification code sent to ${email}`);
  };

  const handleVerifyOtp = async (_code: string) => {
    setIsLoading(true);
    // Simulate verification success
    setTimeout(() => {
      setIsLoading(false);
      setStep('profile');
      toast.success('Email verified successfully!');
    }, 800);
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const session = await authService.register({
        email,
        name,
        password
      });
      setSession(session.user, session.token);
      toast.success(`Account created! Welcome to CampusOS, ${name}`);
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="animate-slide-up" variant="elevated" style={{ width: '100%' }}>
      {/* Back button if in later steps */}
      {step !== 'email' && (
        <button
          type="button"
          onClick={() => setStep(step === 'profile' ? 'otp' : 'email')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            cursor: 'pointer',
            marginBottom: '0.5rem',
            padding: 0
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}

      {/* Progress Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '1.25rem' }}>
        {['email', 'otp', 'profile'].map((s, idx) => (
          <div
            key={s}
            style={{
              width: step === s ? '24px' : '8px',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: step === s ? 'var(--accent)' : 'var(--glass-border)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {step === 'email' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Create University Account</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              Join the unified student & faculty management network
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.84rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="University Email"
              type="email"
              placeholder="student@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              helperText="Must end in .edu for campus verification"
              required
            />

            <Button type="submit" variant="primary" style={{ width: '100%', height: '42px', marginTop: '6px' }}>
              Send Verification Code
            </Button>
          </form>
        </>
      )}

      {step === 'otp' && (
        <OtpFlow
          email={email}
          onVerify={handleVerifyOtp}
          isLoading={isLoading}
          onResend={() => toast.info('New verification code sent!')}
        />
      )}

      {step === 'profile' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Complete Your Profile</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              Provide your details to configure your academic dashboard
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.84rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleCompleteRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Full Legal Name"
              placeholder="e.g. Rahim Ahmed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User size={16} />}
              required
            />

            <Input
              label="Student ID / Faculty Designation"
              placeholder="e.g. 2024-CSE-042"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              leftIcon={<BadgeCheck size={16} />}
            />

            <Input
              label="Create Password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            <Button type="submit" variant="primary" isLoading={isLoading} style={{ width: '100%', height: '42px', marginTop: '6px' }}>
              Finalize Registration
            </Button>
          </form>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Already registered?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>
          Sign In
        </Link>
      </div>
    </Card>
  );
};
