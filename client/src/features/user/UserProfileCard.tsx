import React from 'react';
import { User } from '@shared/types';
import { Card } from '../../components/common/Card';
import { Mail, Shield, Calendar } from 'lucide-react';

interface UserProfileCardProps {
  user: User;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <img
          src={
            user.avatarUrl ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`
          }
          alt={user.name}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--accent-primary)'
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user.name}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Mail size={14} /> {user.email}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--accent-primary)'
              }}
            >
              <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {user.role}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
