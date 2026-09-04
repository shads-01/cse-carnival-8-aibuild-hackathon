import React from 'react';

export type StatusVariant =
  | 'confirmed'
  | 'pending'
  | 'rejected'
  | 'cancelled'
  | 'available'
  | 'unavailable'
  | 'urgent'
  | 'high'
  | 'normal'
  | 'low'
  | 'classroom'
  | 'lab'
  | 'seminar'
  | 'active'
  | 'inactive'
  | 'info';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

const statusMap: Record<string, { bg: string; text: string; border: string; dot: string; label?: string }> = {
  confirmed: {
    bg: 'var(--success-bg)',
    text: 'var(--success)',
    border: 'var(--success-border)',
    dot: 'var(--success)'
  },
  available: {
    bg: 'var(--success-bg)',
    text: 'var(--success)',
    border: 'var(--success-border)',
    dot: 'var(--success)'
  },
  active: {
    bg: 'var(--success-bg)',
    text: 'var(--success)',
    border: 'var(--success-border)',
    dot: 'var(--success)'
  },
  pending: {
    bg: 'var(--warning-bg)',
    text: 'var(--warning)',
    border: 'var(--warning-border)',
    dot: 'var(--warning)'
  },
  urgent: {
    bg: 'var(--danger-bg)',
    text: 'var(--danger)',
    border: 'var(--danger-border)',
    dot: 'var(--danger)'
  },
  high: {
    bg: 'var(--danger-bg)',
    text: 'var(--danger)',
    border: 'var(--danger-border)',
    dot: 'var(--danger)'
  },
  rejected: {
    bg: 'var(--danger-bg)',
    text: 'var(--danger)',
    border: 'var(--danger-border)',
    dot: 'var(--danger)'
  },
  unavailable: {
    bg: 'var(--danger-bg)',
    text: 'var(--danger)',
    border: 'var(--danger-border)',
    dot: 'var(--danger)'
  },
  inactive: {
    bg: 'rgba(113, 113, 122, 0.15)',
    text: '#94a3b8',
    border: 'rgba(113, 113, 122, 0.3)',
    dot: '#94a3b8'
  },
  cancelled: {
    bg: 'rgba(113, 113, 122, 0.15)',
    text: '#94a3b8',
    border: 'rgba(113, 113, 122, 0.3)',
    dot: '#94a3b8'
  },
  normal: {
    bg: 'var(--info-bg)',
    text: 'var(--info)',
    border: 'var(--info-border)',
    dot: 'var(--info)'
  },
  low: {
    bg: 'rgba(113, 113, 122, 0.15)',
    text: 'var(--text-secondary)',
    border: 'rgba(113, 113, 122, 0.25)',
    dot: 'var(--text-dim)'
  },
  classroom: {
    bg: 'rgba(0, 180, 216, 0.12)',
    text: 'var(--accent)',
    border: 'rgba(0, 180, 216, 0.25)',
    dot: 'var(--accent)'
  },
  lab: {
    bg: 'rgba(139, 92, 246, 0.15)',
    text: '#a855f7',
    border: 'rgba(139, 92, 246, 0.3)',
    dot: '#a855f7'
  },
  seminar: {
    bg: 'rgba(236, 72, 153, 0.15)',
    text: '#ec4899',
    border: 'rgba(236, 72, 153, 0.3)',
    dot: '#ec4899'
  },
  info: {
    bg: 'var(--info-bg)',
    text: 'var(--info)',
    border: 'var(--info-border)',
    dot: 'var(--info)'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  showDot = true,
  size = 'md'
}) => {
  const normalizedKey = (variant || status || '').toLowerCase();
  const config = statusMap[normalizedKey] || {
    bg: 'var(--glass-bg)',
    text: 'var(--text-secondary)',
    border: 'var(--glass-border)',
    dot: 'var(--text-dim)'
  };

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: isSmall ? '2px 8px' : '4px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: isSmall ? '0.75rem' : '0.82rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        lineHeight: 1,
        whiteSpace: 'nowrap'
      }}
    >
      {showDot && (
        <span
          style={{
            width: isSmall ? '5px' : '6px',
            height: isSmall ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: config.dot,
            display: 'inline-block',
            boxShadow: `0 0 6px ${config.dot}`
          }}
        />
      )}
      {status}
    </span>
  );
};
