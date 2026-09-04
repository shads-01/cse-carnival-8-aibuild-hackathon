import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { RecordDialog, FieldConfig } from '../../components/common/RecordDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { scheduleService } from '../../services/scheduleService';
import { Schedule, CreateScheduleDto } from '@shared/types';
import { toast } from '../../store/toastStore';
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock } from 'lucide-react';

const scheduleFields: FieldConfig[] = [
  { name: 'course', label: 'Course Code', type: 'text', placeholder: 'e.g. CSE 4113', required: true },
  { name: 'title', label: 'Course Title', type: 'text', placeholder: 'e.g. Pattern Recognition and ML', required: true },
  {
    name: 'day',
    label: 'Day of Week',
    type: 'select',
    required: true,
    options: [
      { value: 'Sunday', label: 'Sunday' },
      { value: 'Monday', label: 'Monday' },
      { value: 'Tuesday', label: 'Tuesday' },
      { value: 'Wednesday', label: 'Wednesday' },
      { value: 'Thursday', label: 'Thursday' }
    ]
  },
  { name: 'start_time', label: 'Start Time (HH:mm)', type: 'text', placeholder: '13:00', required: true },
  { name: 'end_time', label: 'End Time (HH:mm)', type: 'text', placeholder: '13:50', required: true },
  { name: 'room', label: 'Room Number', type: 'text', placeholder: 'e.g. 7A07', required: true },
  { name: 'instructor', label: 'Instructor Name', type: 'text', placeholder: 'e.g. Prof. Dr. Mahbub', required: true },
  { name: 'section', label: 'Section', type: 'text', placeholder: 'e.g. B or CS', required: true }
];

export const AdminSchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await scheduleService.getAll();
      setSchedules(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch schedules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCreate = async (values: Record<string, any>) => {
    const created = await scheduleService.create(values as CreateScheduleDto);
    toast.success(`Created schedule for ${created.course}`);
    fetchSchedules();
  };

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingSchedule) return;
    const updated = await scheduleService.update(editingSchedule.id, values);
    toast.success(`Updated schedule for ${updated.course}`);
    fetchSchedules();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await scheduleService.delete(deletingId);
    toast.success('Schedule deleted successfully');
    setDeletingId(null);
    fetchSchedules();
  };

  const columns: Column<Schedule>[] = [
    {
      key: 'course',
      label: 'Course',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--accent)' }}>{row.course}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sec {row.section}</div>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Title & Instructor',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.title}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{row.instructor}</div>
        </div>
      )
    },
    {
      key: 'day',
      label: 'Day & Time',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.day}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {row.start_time} - {row.end_time}
          </div>
        </div>
      )
    },
    {
      key: 'room',
      label: 'Room',
      sortable: true,
      render: (row) => (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--glass-bg-hover)',
            border: '1px solid var(--glass-border)',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          {row.room}
        </span>
      )
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
            onClick={() => setEditingSchedule(row)}
            style={{ padding: '6px 8px' }}
            title="Edit Schedule"
          >
            <Edit2 size={15} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeletingId(row.id)}
            style={{ padding: '6px 8px' }}
            title="Delete Schedule"
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
        data={schedules}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search courses, rooms, instructors..."
        searchKeys={['course', 'title', 'instructor', 'room', 'day']}
        isLoading={isLoading}
        headerAction={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Add Schedule
          </Button>
        }
      />

      {/* Create Dialog */}
      <RecordDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Academic Routine Session"
        subtitle="Schedule a new class period, lab, or tutorial slot"
        fields={scheduleFields}
        onSubmit={handleCreate}
        submitLabel="Add Class Slot"
      />

      {/* Edit Dialog */}
      {editingSchedule && (
        <RecordDialog
          isOpen={true}
          onClose={() => setEditingSchedule(null)}
          title={`Edit Schedule: ${editingSchedule.course}`}
          subtitle="Modify class timing, room assignment or instructor"
          fields={scheduleFields}
          initialValues={editingSchedule}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Schedule Slot"
        message="Are you sure you want to remove this course schedule? This action cannot be undone."
      />
    </div>
  );
};
