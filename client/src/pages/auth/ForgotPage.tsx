import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { OtpFlow } from '../../components/auth/OtpFlow';
import { toast } from '../../store/toastStore';
import { Mail, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.endsWith('.edu')) {
      setError('Please provide a valid university email address (*.edu)');
      return;
    }
    setStep('otp');
    toast.info(`Reset code dispatched to ${email}`);
  };

  const handleVerifyOtp = async (_code: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('reset');
      toast.success('Security code verified. Set your new password.');
    }, 800);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Password updated successfully! You may now sign in.');
      navigate('/login');
    }, 900);
  };

  return (
    <Card className="animate-slide-up" variant="elevated" style={{ width: '100%' }}>
      {step !== 'email' && (
        <button
          type="button"
          onClick={() => setStep(step === 'reset' ? 'otp' : 'email')}
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

      {step === 'email' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Reset Password</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              Enter your registered university email to receive a recovery code
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
              required
            />

            <Button type="submit" variant="primary" style={{ width: '100%', height: '42px', marginTop: '6px' }}>
              Send Recovery Code
            </Button>
          </form>
        </>
      )}

      {step === 'otp' && (
        <OtpFlow
          email={email}
          onVerify={handleVerifyOtp}
          isLoading={isLoading}
          onResend={() => toast.info('New recovery code sent!')}
        />
      )}

      {step === 'reset' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Set New Password</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              Choose a strong password to secure your account
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.84rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="New Password"
              type="password"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            <Button type="submit" variant="primary" isLoading={isLoading} style={{ width: '100%', height: '42px', marginTop: '6px' }}>
              Update Password & Sign In
            </Button>
          </form>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Remembered your password?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>
          Sign In
        </Link>
      </div>
    </Card>
  );
};
