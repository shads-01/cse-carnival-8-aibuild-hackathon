import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Input } from '../../components/common/Input';
import { announcementService } from '../../services/announcementService';
import { Announcement } from '@shared/types';
import { toast } from '../../store/toastStore';
import { Megaphone, Calendar, User, Search, Tag, AlertCircle } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await announcementService.getAll();
        setAnnouncements(data);
      } catch (err: any) {
        toast.error('Failed to load notices');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const categories = [
    { id: 'all', label: 'All Notices' },
    { id: 'urgent', label: 'Urgent Circulars' },
    { id: 'academic', label: 'Academic & Routine' },
    { id: 'administrative', label: 'Registrar Office' },
    { id: 'events', label: 'Co-Curricular' }
  ];

  const filtered = announcements.filter((a) => {
    if (activeCategory === 'urgent') {
      if (a.priority !== 'high') return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.body.toLowerCase().includes(q) ||
      a.posted_by.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Official Campus Announcements
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
            Notices, circulars, and semester advisories from faculty and administration
          </p>
        </div>

        <div style={{ width: '280px' }}>
          <Input
            placeholder="Search circulars or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="glass"
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--glass-border)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                background: isSelected ? 'var(--accent-gradient)' : 'transparent',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Notices Stream */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No notices found"
          description="There are currently no active announcements in this category."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((ann) => {
            const isUrgent = ann.priority === 'high';
            return (
              <div
                key={ann.id}
                className="glass-card animate-slide-up"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderLeft: `4px solid ${isUrgent ? 'var(--danger)' : 'var(--accent)'}`
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={ann.priority} size="sm" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    <Calendar size={13} /> Published on {ann.date}
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                    lineHeight: 1.3
                  }}
                >
                  {ann.title}
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {ann.body}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.76rem',
                    color: 'var(--text-dim)',
                    borderTop: '1px solid var(--glass-border-subtle)',
                    paddingTop: '8px',
                    marginTop: '4px'
                  }}
                >
                  <User size={12} /> Issued by: <strong style={{ color: 'var(--text-secondary)' }}>{ann.posted_by}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
