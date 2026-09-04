import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { scheduleService } from '../../services/scheduleService';
import { roomService } from '../../services/roomService';
import { eventService } from '../../services/eventService';
import { announcementService } from '../../services/announcementService';
import { requestService, RoomBookingRequest } from '../../services/requestService';
import {
  Calendar,
  Building2,
  Sparkles,
  Megaphone,
  Inbox,
  ArrowRight,
  Clock,
  MapPin,
  Check,
  X
} from 'lucide-react';
import { Schedule, Announcement } from '@shared/types';
import { toast } from '../../store/toastStore';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [requests, setRequests] = useState<RoomBookingRequest[]>([]);
  const [roomCount, setRoomCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sch, rms, evts, anns, reqs] = await Promise.all([
        scheduleService.getAll(),
        roomService.getAll(),
        eventService.getAll(),
        announcementService.getAll(),
        requestService.getAll()
      ]);
      setSchedules(sch);
      setRoomCount(rms.length);
      setEventCount(evts.length);
      setAnnouncements(anns);
      setRequests(reqs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const todaySchedules = schedules.slice(0, 5);
  const highPriorityAnnouncements = announcements.filter(
    (a) => a.priority === 'high'
  ).slice(0, 3);

  const handleApprove = async (id: string) => {
    try {
      await requestService.approve(id);
      toast.success('Room request approved!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await requestService.reject(id);
      toast.info('Room request declined');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stat Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        <StatCard
          title="Active Classes"
          value={schedules.length}
          subtitle="Across 5 days"
          icon={<Calendar size={22} />}
          onClick={() => navigate('/admin/schedules')}
        />
        <StatCard
          title="Campus Facilities"
          value={roomCount}
          subtitle="Labs & Classrooms"
          icon={<Building2 size={22} />}
          onClick={() => navigate('/admin/rooms')}
        />
        <StatCard
          title="Upcoming Events"
          value={eventCount}
          subtitle="Active Registrations"
          icon={<Sparkles size={22} />}
          onClick={() => navigate('/admin/events')}
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests.length}
          subtitle="Requires Review"
          icon={<Inbox size={22} />}
          trend={{ value: `${pendingRequests.length} new`, isPositive: pendingRequests.length === 0 }}
          onClick={() => navigate('/admin/requests')}
        />
      </div>

      {/* Main Grid: Pending Approvals & Today's Schedule */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Pending Requests Stream */}
        <Card
          title="Pending Facility Reservations"
          subtitle={`${pendingRequests.length} reservations awaiting administrative action`}
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/requests')}
              rightIcon={<ArrowRight size={15} />}
            >
              View All
            </Button>
          }
        >
          {pendingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              All space requests have been addressed
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingRequests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  className="glass"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        Room {req.room_number}
                      </span>
                      <StatusBadge status="pending" size="sm" />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {req.user_name} · {req.date} ({req.start_time} - {req.end_time})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.purpose}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(req.id)}
                      style={{ padding: '6px 10px' }}
                      title="Approve"
                    >
                      <Check size={15} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(req.id)}
                      style={{ padding: '6px 10px' }}
                      title="Decline"
                    >
                      <X size={15} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Priority Campus Announcements */}
        <Card
          title="High Priority Notices"
          subtitle="Urgent broadcast announcements across campus"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/announcements')}
              rightIcon={<ArrowRight size={15} />}
            >
              View Board
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {highPriorityAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="glass"
                style={{
                  padding: '12px 14px',
                  borderLeft: '4px solid var(--danger)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {ann.title}
                  </span>
                  <StatusBadge status={ann.priority} size="sm" />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {ann.body}
                </p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Issued by {ann.posted_by} · {ann.date}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Routine Schedules Quick View */}
      <Card
        title="Today's Academic Routine"
        subtitle="Live class sessions currently active or upcoming today"
        headerAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/schedules')}
            rightIcon={<ArrowRight size={15} />}
          >
            Full Routine
          </Button>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {todaySchedules.map((sch) => (
            <div
              key={sch.id}
              className="glass"
              style={{
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent)' }}>
                  {sch.course}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                  Sec {sch.section}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {sch.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> {sch.start_time} - {sch.end_time}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> Room {sch.room}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
