import React from 'react';
import { Card } from '../../components/common/Card';
import { Users, ShieldCheck, Activity, Server } from 'lucide-react';
import { User } from '@shared/types';

interface DashboardOverviewProps {
  user: User | null;
  totalUsers: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ user, totalUsers }) => {
  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: '#6366f1' },
    { label: 'System Role', value: user?.role || 'USER', icon: ShieldCheck, color: '#10b981' },
    { label: 'API Health', value: 'Operational', icon: Activity, color: '#f59e0b' },
    { label: 'Database Service', value: 'Supabase', icon: Server, color: '#ec4899' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Here is what is happening across your full-stack system today.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {stat.label}
                </span>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: `${stat.color}20`,
                    color: stat.color
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {stat.value}
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
