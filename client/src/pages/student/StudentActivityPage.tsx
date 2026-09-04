import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { requestService, RoomBookingRequest } from '../../services/requestService';
import { eventService } from '../../services/eventService';
import { Event, EventRegistration } from '@shared/types';
import { toast } from '../../store/toastStore';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, Clock, MapPin, Building2, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentActivityPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RoomBookingRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqs, evts] = await Promise.all([
        requestService.getAll(),
        eventService.getAll()
      ]);
      setRequests(reqs);
      setEvents(evts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userEmail = user?.email || 'student@campus.edu';

  // Filter requests submitted by this student or demo student
  const myRequests = requests.filter(
    (r) => r.user_email === userEmail || r.user_name === user?.name || r.user_name === 'Rahim Ahmed'
  );

  // Filter registered events
  const myRegisteredEvents = events.filter((e) =>
    e.registrations?.some((r: EventRegistration) => r.student_id === userEmail || r.name === user?.name)
  );

  const handleCancelRegistration = async (evt: Event) => {
    const reg = evt.registrations?.find((r: EventRegistration) => r.student_id === userEmail || r.name === user?.name);
    if (!reg) return;
    try {
      await eventService.cancelRegistration(evt.id, reg.id);
      toast.info(`Cancelled registration for "${evt.name}"`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to cancel registration');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          My Campus Activity
        </h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
          Facility reservation requests and registered event seats
        </p>
      </div>

      {/* Section 1: Room Reservations */}
      <Card
        title="My Facility Reservations"
        subtitle="Tracking administrative approval and access passes"
      >
        {myRequests.length === 0 ? (
          <EmptyState
            title="No reservation requests"
            description="You have not requested any room bookings yet. You can submit one from the Home dashboard."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="glass"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--accent-muted)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem'
                    }}
                  >
                    {req.room_number}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                        Room {req.room_number}
                      </span>
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Purpose: {req.purpose}
                    </div>
                    {req.rejection_reason && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '2px' }}>
                        Decline note: {req.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', fontWeight: 600 }}>
                    <Calendar size={13} style={{ color: 'var(--text-dim)' }} /> {req.date}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                    <Clock size={12} style={{ color: 'var(--text-dim)' }} /> {req.start_time} - {req.end_time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Section 2: Event Registrations */}
      <Card
        title="My Registered Events"
        subtitle="Confirmed event admissions and workshop passes"
      >
        {myRegisteredEvents.length === 0 ? (
          <EmptyState
            title="No event registrations"
            description="You have not reserved seats for any events yet. Check out the Events catalog!"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myRegisteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="glass"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                      {evt.name}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--success-bg)',
                        color: 'var(--success)',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      Confirmed Pass
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '2px' }}>
                    Organized by {evt.organizer}
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> {evt.date} ({evt.start_time} - {evt.end_time})
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> {evt.venue}
                    </span>
                  </div>
                </div>

                <div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleCancelRegistration(evt)}
                    leftIcon={<X size={14} />}
                  >
                    Cancel Seat
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
