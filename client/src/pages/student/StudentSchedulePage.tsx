import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { scheduleService } from '../../services/scheduleService';
import { Schedule, DayOfWeek } from '@shared/types';
import { toast } from '../../store/toastStore';
import { Clock, MapPin, User, Search, BookOpen } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

const DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export const StudentSchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Sunday');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await scheduleService.getAll();
        setSchedules(data);
      } catch (err: any) {
        toast.error('Failed to load routine');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const daySchedules = schedules.filter((s) => {
    const matchesDay = s.day === selectedDay;
    if (!matchesDay) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.course.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.room.toLowerCase().includes(q) ||
      s.instructor?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Weekly Academic Routine
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
            Class periods, laboratory sessions, and assigned halls
          </p>
        </div>

        <div style={{ width: '260px' }}>
          <Input
            placeholder="Filter courses or rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}
      >
        {DAYS.map((day) => {
          const count = schedules.filter((s) => s.day === day).length;
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--glass-border)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                background: isSelected ? 'var(--accent-gradient)' : 'transparent',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              <span>{day}</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--glass-bg-hover)',
                  color: isSelected ? '#ffffff' : 'var(--text-dim)'
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <Skeleton height="140px" />
          <Skeleton height="140px" />
          <Skeleton height="140px" />
        </div>
      ) : daySchedules.length === 0 ? (
        <EmptyState
          title={`No classes on ${selectedDay}`}
          description={search ? 'No classes matched your search filter.' : 'Enjoy your free day or work on project milestones!'}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1rem'
          }}
        >
          {daySchedules.map((sch) => (
            <div
              key={sch.id}
              className="glass-card animate-slide-up"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '1.25rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)' }}>
                    {sch.course}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--glass-bg-hover)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Sec {sch.section}
                  </span>
                </div>

                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', margin: 0 }}>
                  {sch.title}
                </h3>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--glass-border-subtle)',
                  paddingTop: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} style={{ color: 'var(--accent)' }} /> {sch.start_time} - {sch.end_time}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}
                  >
                    <MapPin size={14} style={{ color: 'var(--accent)' }} /> Room {sch.room}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-dim)' }}>
                  <User size={13} /> {sch.instructor}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
