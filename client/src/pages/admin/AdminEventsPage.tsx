import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RecordDialog, FieldConfig } from '../../components/common/RecordDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { eventService } from '../../services/eventService';
import { Event, CreateEventDto } from '@shared/types';
import { toast } from '../../store/toastStore';
import { Plus, Edit2, Trash2, Calendar, MapPin, Users, Sparkles } from 'lucide-react';

const eventFields: FieldConfig[] = [
  { name: 'name', label: 'Event Name', type: 'text', placeholder: 'e.g. AI & Robotics Hackathon 2026', required: true },
  { name: 'organizer', label: 'Host Club / Department', type: 'text', placeholder: 'e.g. CSE Society', required: true },
  { name: 'date', label: 'Start Date (YYYY-MM-DD)', type: 'date', required: true },
  { name: 'end_date', label: 'End Date (YYYY-MM-DD)', type: 'date', required: true },
  { name: 'start_time', label: 'Start Time (HH:mm)', type: 'text', placeholder: '10:00', required: true },
  { name: 'end_time', label: 'End Time (HH:mm)', type: 'text', placeholder: '16:00', required: true },
  { name: 'venue', label: 'Venue / Hall', type: 'text', placeholder: 'e.g. Central Auditorium', required: true },
  { name: 'capacity', label: 'Max Attendees Capacity', type: 'number', placeholder: '120', required: true },
  {
    name: 'status',
    label: 'Event Status',
    type: 'select',
    required: true,
    options: [
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'ongoing', label: 'Ongoing' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    ]
  },
  { name: 'description', label: 'Event Brief / Details', type: 'textarea', placeholder: 'Detailed description of agenda...' }
];

export const AdminEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getAll();
      setEvents(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (values: Record<string, any>) => {
    const created = await eventService.create(values as CreateEventDto);
    toast.success(`Published event "${created.name}"`);
    fetchEvents();
  };

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingEvent) return;
    const updated = await eventService.update(editingEvent.id, values);
    toast.success(`Updated event "${updated.name}"`);
    fetchEvents();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await eventService.delete(deletingId);
    toast.success('Event removed successfully');
    setDeletingId(null);
    fetchEvents();
  };

  const columns: Column<Event>[] = [
    {
      key: 'name',
      label: 'Event & Organizer',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {row.name}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent)', marginTop: '2px' }}>
            By {row.organizer}
          </div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date & Time',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} style={{ color: 'var(--text-dim)' }} /> {row.date}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {row.start_time} - {row.end_time}
          </div>
        </div>
      )
    },
    {
      key: 'venue',
      label: 'Venue',
      sortable: true,
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
          <MapPin size={14} style={{ color: 'var(--accent)' }} /> {row.venue}
        </span>
      )
    },
    {
      key: 'registered',
      label: 'Registrations',
      sortable: true,
      render: (row) => {
        const pct = Math.min(100, Math.round(((row.registered || 0) / (row.capacity || 1)) * 100));
        return (
          <div style={{ width: '130px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700 }}>{row.registered || 0} / {row.capacity}</span>
              <span style={{ color: 'var(--text-dim)' }}>{pct}%</span>
            </div>
            <div
              style={{
                height: '6px',
                width: '100%',
                borderRadius: 'var(--radius-full)',
                background: 'var(--glass-bg-hover)',
                overflow: 'hidden'
              }}
            >
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
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status || 'upcoming'} size="sm" />
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingEvent(row)}
            style={{ padding: '6px 8px' }}
            title="Edit Event"
          >
            <Edit2 size={15} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeletingId(row.id)}
            style={{ padding: '6px 8px' }}
            title="Delete Event"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DataTable
        columns={columns}
        data={events}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search event name, organizer, venue..."
        searchKeys={['name', 'organizer', 'venue']}
        isLoading={isLoading}
        headerAction={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Create Event
          </Button>
        }
      />

      <RecordDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Host New Campus Event"
        subtitle="Publish a workshop, seminar, tech fest or guest lecture"
        fields={eventFields}
        initialValues={{ status: 'upcoming' }}
        onSubmit={handleCreate}
        submitLabel="Publish Event"
      />

      {editingEvent && (
        <RecordDialog
          isOpen={true}
          onClose={() => setEditingEvent(null)}
          title={`Edit Event: ${editingEvent.name}`}
          subtitle="Update agenda, venue, capacity limits or date"
          fields={eventFields}
          initialValues={editingEvent}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Campus Event"
        message="Are you sure you want to cancel and remove this event? All student registrations will be revoked."
      />
    </div>
  );
};
