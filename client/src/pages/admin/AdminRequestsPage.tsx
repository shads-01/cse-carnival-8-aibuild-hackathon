import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { requestService, RoomBookingRequest } from '../../services/requestService';
import { toast } from '../../store/toastStore';
import { Check, X, Inbox, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const AdminRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RoomBookingRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [rejectingReq, setRejectingReq] = useState<RoomBookingRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await requestService.getAll();
      setRequests(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch room requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await requestService.approve(id);
      toast.success('Room reservation request approved!');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Approval failed');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingReq) return;
    try {
      await requestService.reject(rejectingReq.id, rejectionReason || undefined);
      toast.info('Room reservation declined');
      setRejectingReq(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleBatchApprove = async () => {
    const pending = requests.filter((r) => r.status === 'pending');
    if (pending.length === 0) {
      toast.info('No pending requests to approve');
      return;
    }
    for (const req of pending) {
      await requestService.approve(req.id);
    }
    toast.success(`Batch approved ${pending.length} room reservation requests`);
    fetchRequests();
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const columns: Column<RoomBookingRequest>[] = [
    {
      key: 'room_number',
      label: 'Room Facility',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-muted)',
              color: 'var(--accent)',
              fontWeight: 800,
              fontSize: '0.92rem'
            }}
          >
            {row.room_number}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {row.id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'user_name',
      label: 'Requester',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.user_name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{row.user_email}</div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date & Time Slot',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} style={{ color: 'var(--text-dim)' }} /> {row.date}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {row.start_time} - {row.end_time}
          </div>
        </div>
      )
    },
    {
      key: 'purpose',
      label: 'Reservation Purpose',
      render: (row) => (
        <div style={{ maxWidth: '280px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {row.purpose}
          {row.rejection_reason && (
            <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '3px' }}>
              Reason: {row.rejection_reason}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      key: 'actions',
      label: 'Administrative Action',
      align: 'right',
      render: (row) => {
        if (row.status !== 'pending') {
          return (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              Resolved
            </span>
          );
        }
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleApprove(row.id)}
              leftIcon={<Check size={14} />}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setRejectingReq(row)}
              leftIcon={<X size={14} />}
            >
              Decline
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & Batch Action */}
      <div
        className="glass"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Inbox size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {pendingCount} Pending Facility Approvals
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Review student club, faculty and team space reservations
            </div>
          </div>
        </div>

        {pendingCount > 0 && (
          <Button
            variant="glass"
            size="sm"
            onClick={handleBatchApprove}
            leftIcon={<CheckCircle2 size={16} />}
          >
            Batch Approve All ({pendingCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['all', 'pending', 'confirmed', 'rejected'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className="glass"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--glass-border)',
              fontSize: '0.825rem',
              fontWeight: 700,
              textTransform: 'capitalize',
              cursor: 'pointer',
              color: filterStatus === st ? '#ffffff' : 'var(--text-secondary)',
              background: filterStatus === st ? 'var(--accent-gradient)' : 'transparent',
              boxShadow: filterStatus === st ? 'var(--shadow-glow)' : 'none'
            }}
          >
            {st === 'pending' ? `Pending (${pendingCount})` : st}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search applicant name, email, room number..."
        searchKeys={['user_name', 'user_email', 'room_number', 'purpose']}
        isLoading={isLoading}
      />

      {/* Decline Reason Dialog */}
      <Modal
        isOpen={!!rejectingReq}
        onClose={() => setRejectingReq(null)}
        title="Decline Reservation Request"
        subtitle={`Room ${rejectingReq?.room_number} for ${rejectingReq?.user_name}`}
        maxWidth="460px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Specify why this facility reservation cannot be fulfilled. The applicant will receive this rationale in their notification feed.
          </p>

          <Input
            label="Reason for Declining"
            placeholder="e.g. Schedule clash with CSE 4113 or maintenance in progress"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setRejectingReq(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetPasswordDecline}>
              Confirm Decline
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  function handleResetPasswordDecline() {
    handleRejectConfirm();
  }
};
