import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { MailCheck, RotateCcw } from 'lucide-react';

interface OtpFlowProps {
  email: string;
  onVerify: (code: string) => Promise<void> | void;
  onResend?: () => void;
  isLoading?: boolean;
}

export const OtpFlow: React.FC<OtpFlowProps> = ({
  email,
  onVerify,
  onResend,
  isLoading = false
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const nextDigits = [...digits];
    nextDigits[index] = val.slice(-1);
    setDigits(nextDigits);
    setError(null);

    // Auto focus next
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const newDigits = pasteData.split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code');
      return;
    }
    try {
      await onVerify(code);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--accent-muted)',
            color: 'var(--accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}
        >
          <MailCheck size={24} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Check your inbox</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          We sent a 6-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
        </p>
      </div>

      <div
        onPaste={handlePaste}
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          margin: '0.5rem 0'
        }}
      >
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="glass-input"
            style={{
              width: '44px',
              height: '52px',
              textAlign: 'center',
              fontSize: '1.3rem',
              fontWeight: 700,
              padding: 0
            }}
          />
        ))}
      </div>

      {error && (
        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" isLoading={isLoading} style={{ width: '100%', height: '42px' }}>
        Verify & Continue
      </Button>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
        <span style={{ color: 'var(--text-dim)' }}>Didn't receive the code?</span>
        {countdown > 0 ? (
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Resend in {countdown}s</span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCountdown(60);
              onResend && onResend();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RotateCcw size={13} /> Resend code
          </button>
        )}
      </div>
    </form>
  );
};
