import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { scheduleService } from '../../services/scheduleService';
import { announcementService } from '../../services/announcementService';
import { eventService } from '../../services/eventService';
import { assignmentService } from '../../services/assignmentService';
import { requestService } from '../../services/requestService';
import { Schedule, Announcement, Event, Assignment } from '@shared/types';
import { toast } from '../../store/toastStore';
import { useAuth } from '../../hooks/useAuth';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Megaphone,
  BookOpen,
  ArrowRight,
  Plus,
  Send,
  Building2,
  Bot
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';

export const StudentHomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick room reservation modal state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [roomNum, setRoomNum] = useState('7A02');
  const [bookDate, setBookDate] = useState('2026-09-06');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [purpose, setPurpose] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sch, anns, evts, asgs] = await Promise.all([
        scheduleService.getAll(),
        announcementService.getAll(),
        eventService.getAll(),
        assignmentService.getAll()
      ]);
      setSchedules(sch);
      setAnnouncements(anns);
      setEvents(evts);
      setAssignments(asgs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const nextClass = schedules[0];
  const urgentAnnouncements = announcements.filter(
    (a) => a.priority === 'high'
  ).slice(0, 2);
  const upcomingDeadlines = assignments.slice(0, 3);
  const featuredEvents = events.slice(0, 2);

  const handleRegisterEvent = async (evt: Event) => {
    try {
      await eventService.register(evt.id, user?.name || 'Student', user?.email || 'student@campus.edu');
      toast.success(`Registered for ${evt.name}!`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  const handleQuickBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      toast.error('Please enter the purpose of reservation');
      return;
    }
    try {
      await requestService.create({
        room_id: 'room-001',
        room_number: roomNum,
        user_name: user?.name || 'Student',
        user_email: user?.email || 'student@campus.edu',
        date: bookDate,
        start_time: startTime,
        end_time: endTime,
        purpose
      });
      toast.success(`Booking request for Room ${roomNum} submitted for admin review!`);
      setIsBookModalOpen(false);
      setPurpose('');
    } catch (err: any) {
      toast.error(err.message || 'Request submission failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero: Next Class Banner */}
      {nextClass && (
        <div
          className="glass-elevated animate-slide-up"
          style={{
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--glass-border-hover)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'var(--accent-glow)',
              filter: 'blur(35px)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-muted)',
                    color: 'var(--accent)'
                  }}
                >
                  Up Next · Today
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {nextClass.day} {nextClass.start_time} - {nextClass.end_time}
                </span>
              </div>

              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  marginTop: '8px',
                  marginBottom: '4px'
                }}
              >
                {nextClass.course}: {nextClass.title}
              </h2>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={15} style={{ color: 'var(--accent)' }} /> Room {nextClass.room}
                </span>
                <span>Section {nextClass.section}</span>
                <span>Instructor: {nextClass.instructor}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="glass"
                size="md"
                onClick={() => navigate('/app/schedule')}
                rightIcon={<ArrowRight size={15} />}
              >
                Full Routine
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsBookModalOpen(true)}
                leftIcon={<Plus size={16} />}
              >
                Request Room
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dual Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Urgent Campus Circulars */}
        <Card
          title="Important Announcements"
          subtitle="Official administrative and academic circulars"
          headerAction={
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/announcements')}>
              View All
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {urgentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="glass"
                style={{
                  padding: '12px 14px',
                  borderLeft: '3px solid var(--danger)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {ann.title}
                  </span>
                  <StatusBadge status={ann.priority} size="sm" />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {ann.body}
                </p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {ann.date} · {ann.posted_by}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Coursework Deadlines */}
        <Card
          title="Pending Coursework"
          subtitle="Assignments and problem sets due shortly"
          headerAction={
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/assignments')}>
              View All
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcomingDeadlines.map((asg) => (
              <div
                key={asg.id}
                className="glass"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {asg.course}: {asg.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                    <Clock size={13} style={{ color: 'var(--warning)' }} /> Due {asg.deadline}
                  </div>
                </div>

                <StatusBadge status="Due Soon" variant="urgent" size="sm" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Featured Events Stream */}
      <Card
        title="Upcoming Campus Workshops & Events"
        subtitle="Reserve your seat in tech talks, hackathons, and seminars"
        headerAction={
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/events')}>
            Browse Events
          </Button>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {featuredEvents.map((evt) => (
            <div
              key={evt.id}
              className="glass"
              style={{
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {evt.name}
                  </span>
                  <StatusBadge status={evt.status || 'upcoming'} size="sm" />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent)', marginTop: '2px' }}>
                  Host: {evt.organizer}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                  <Calendar size={13} /> {evt.date} ({evt.start_time} - {evt.end_time})
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <MapPin size={13} /> {evt.venue}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {evt.registered || 0} / {evt.capacity} registered
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRegisterEvent(evt)}
                >
                  Register Seat
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Room Reservation Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Request Room Reservation"
        subtitle="Submit a booking request for study group, mock contest, or club meet"
        maxWidth="500px"
      >
        <form onSubmit={handleQuickBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Room Number"
              placeholder="e.g. 7A02"
              value={roomNum}
              onChange={(e) => setRoomNum(e.target.value)}
              required
            />
            <Input
              label="Reservation Date"
              type="date"
              value={bookDate}
              onChange={(e) => setBookDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Start Time"
              placeholder="14:00"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              placeholder="16:00"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Purpose of Booking"
            placeholder="e.g. ACM ICPC Team Practice & Discussion"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
            <Button variant="ghost" type="button" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
