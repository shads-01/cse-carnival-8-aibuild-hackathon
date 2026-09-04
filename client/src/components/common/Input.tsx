import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  style,
  id,
  className = '',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.01em'
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-dim)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`glass-input ${className}`}
          style={{
            width: '100%',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            paddingLeft: leftIcon ? '38px' : '12px',
            paddingRight: rightIcon ? '38px' : '12px',
            borderColor: error ? 'var(--danger)' : undefined,
            ...style
          }}
          {...props}
        />

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-dim)',
              zIndex: 1
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 500 }}>
          {error}
        </span>
      )}
      {!error && helperText && (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
