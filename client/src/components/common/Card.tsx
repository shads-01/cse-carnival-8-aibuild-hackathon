import React, { HTMLAttributes } from 'react';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  variant?: 'glass' | 'elevated';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  variant = 'glass',
  noPadding = false,
  children,
  className = '',
  style,
  ...props
}) => {
  const cardClass = variant === 'elevated' ? 'glass-elevated' : 'glass';

  return (
    <div
      className={`${cardClass} ${className}`}
      style={{
        padding: noPadding ? '0' : '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: noPadding ? '0' : '1.25rem',
        ...style
      }}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: noPadding ? '1.25rem 1.5rem 0' : undefined
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  margin: 0
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginTop: '3px',
                  margin: 0
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
