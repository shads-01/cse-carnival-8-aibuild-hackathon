import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Input } from '../../components/common/Input';
import { eventService } from '../../services/eventService';
import { Event, EventRegistration } from '@shared/types';
import { toast } from '../../store/toastStore';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, Clock, MapPin, Search, Sparkles, CheckCircle2, Users } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getAll();
      setEvents(data);
    } catch (err: any) {
      toast.error('Failed to load campus events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (evt: Event) => {
    try {
      await eventService.register(evt.id, user?.name || 'Student', user?.email || 'student@campus.edu');
      toast.success(`Successfully registered for "${evt.name}"!`);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  const isUserRegistered = (evt: Event) => {
    const userIdentifier = user?.email || user?.id || 'student@campus.edu';
    return evt.registrations?.some((r: EventRegistration) => r.student_id === userIdentifier || r.name === user?.name);
  };

  const filtered = events.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Campus Events & Workshops
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
            Guest lectures, robotics bootcamps, and hackathons
          </p>
        </div>

        <div style={{ width: '280px' }}>
          <Input
            placeholder="Search events or organizers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <Skeleton height="220px" />
          <Skeleton height="220px" />
          <Skeleton height="220px" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try modifying your search criteria or check back later for new club activities."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((evt) => {
            const registered = isUserRegistered(evt);
            const isFull = (evt.registered || 0) >= evt.capacity;
            const pct = Math.min(100, Math.round(((evt.registered || 0) / evt.capacity) * 100));

            return (
              <div
                key={evt.id}
                className="glass-card animate-slide-up"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  padding: '1.5rem',
                  borderColor: registered ? 'var(--accent)' : undefined
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--accent)'
                      }}
                    >
                      {evt.organizer}
                    </span>
                    <StatusBadge status={evt.status || 'upcoming'} size="sm" />
                  </div>

                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginTop: '6px',
                      marginBottom: '6px',
                      lineHeight: 1.3
                    }}
                  >
                    {evt.name}
                  </h3>

                  {evt.description && (
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      {evt.description}
                    </p>
                  )}
                </div>

                {/* Event Logistics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: 'var(--accent)' }} />
                    <span>{evt.date} · {evt.start_time} - {evt.end_time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ color: 'var(--accent)' }} />
                    <span>{evt.venue}</span>
                  </div>
                </div>

                {/* Capacity Gauge */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={12} /> {evt.registered || 0} / {evt.capacity} Seats Filled
                    </span>
                    <span style={{ fontWeight: 700, color: pct >= 90 ? 'var(--danger)' : 'var(--accent)' }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: '6px', width: '100%', borderRadius: 'var(--radius-full)', background: 'var(--glass-bg-hover)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 'var(--radius-full)',
                        background: pct >= 90 ? 'var(--danger)' : 'var(--accent-gradient)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div style={{ borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '10px' }}>
                  {registered ? (
                    <Button
                      variant="glass"
                      size="sm"
                      disabled
                      style={{ width: '100%', color: 'var(--success)' }}
                      leftIcon={<CheckCircle2 size={16} />}
                    >
                      Seat Confirmed
                    </Button>
                  ) : isFull ? (
                    <Button variant="ghost" size="sm" disabled style={{ width: '100%' }}>
                      Event at Full Capacity
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRegister(evt)}
                      style={{ width: '100%' }}
                    >
                      Reserve My Seat
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
