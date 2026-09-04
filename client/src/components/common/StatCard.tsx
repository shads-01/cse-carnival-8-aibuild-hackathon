import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick
}) => {
  return (
    <div
      className="glass-card"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div>
          <span
            style={{
              fontSize: '0.825rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            {title}
          </span>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginTop: '4px',
              letterSpacing: '-0.02em',
              lineHeight: 1.15
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            flexShrink: 0
          }}
        >
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            fontSize: '0.8rem'
          }}
        >
          {trend && (
            <span
              style={{
                fontWeight: 700,
                color: trend.isPositive ? 'var(--success)' : 'var(--danger)'
              }}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span style={{ color: 'var(--text-dim)' }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
