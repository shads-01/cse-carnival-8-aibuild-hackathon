import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className = '',
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition-normal)',
    border: '1px solid transparent',
    outline: 'none',
    opacity: disabled || isLoading ? 0.6 : 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...style
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--accent-gradient)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-glow)'
    },
    secondary: {
      background: 'var(--glass-bg)',
      color: 'var(--text-primary)',
      borderColor: 'var(--glass-border)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    },
    glass: {
      background: 'var(--glass-bg-hover)',
      color: 'var(--text-primary)',
      borderColor: 'var(--glass-border-hover)',
      backdropFilter: 'blur(var(--glass-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-blur))',
      boxShadow: 'var(--shadow-glass)'
    },
    danger: {
      background: 'var(--danger-bg)',
      color: 'var(--danger)',
      borderColor: 'var(--danger-border)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent'
    }
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '0.85rem' },
    md: { padding: '9px 18px', fontSize: '0.925rem' },
    lg: { padding: '12px 24px', fontSize: '1rem' }
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size]
      }}
      disabled={disabled || isLoading}
      className={`btn-${variant} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
