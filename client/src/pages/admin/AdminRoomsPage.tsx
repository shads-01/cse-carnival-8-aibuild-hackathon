import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RecordDialog, FieldConfig } from '../../components/common/RecordDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { roomService } from '../../services/roomService';
import { Room, CreateRoomDto } from '@shared/types';
import { toast } from '../../store/toastStore';
import { Plus, Edit2, Trash2, Building2, Users } from 'lucide-react';

const roomFields: FieldConfig[] = [
  { name: 'room_number', label: 'Room Number', type: 'text', placeholder: 'e.g. 7A05', required: true },
  {
    name: 'type',
    label: 'Room Type',
    type: 'select',
    required: true,
    options: [
      { value: 'classroom', label: 'Classroom' },
      { value: 'lab', label: 'Computer / Hardware Lab' },
      { value: 'seminar', label: 'Seminar Hall / Auditorium' }
    ]
  },
  { name: 'capacity', label: 'Seating Capacity', type: 'number', placeholder: 'e.g. 50', required: true },
  { name: 'floor', label: 'Floor Level', type: 'number', placeholder: 'e.g. 7', required: true },
  {
    name: 'status',
    label: 'Operational Status',
    type: 'select',
    required: true,
    options: [
      { value: 'available', label: 'Available' },
      { value: 'unavailable', label: 'Unavailable / Maintenance' }
    ]
  },
  {
    name: 'equipment_str',
    label: 'Equipment (comma separated)',
    type: 'text',
    placeholder: 'Projector, Whiteboard, AC, Sound System'
  }
];

export const AdminRoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const data = await roomService.getAll();
      setRooms(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreate = async (values: Record<string, any>) => {
    const equip = values.equipment_str
      ? values.equipment_str.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    const created = await roomService.create({
      ...values,
      equipment: equip
    } as CreateRoomDto);
    toast.success(`Registered Room ${created.room_number}`);
    fetchRooms();
  };

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingRoom) return;
    const equip = values.equipment_str
      ? values.equipment_str.split(',').map((s: string) => s.trim()).filter(Boolean)
      : editingRoom.equipment;
    const updated = await roomService.update(editingRoom.id, {
      ...values,
      equipment: equip
    });
    toast.success(`Updated Room ${updated.room_number}`);
    fetchRooms();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await roomService.delete(deletingId);
    toast.success('Room facility retired successfully');
    setDeletingId(null);
    fetchRooms();
  };

  const columns: Column<Room>[] = [
    {
      key: 'room_number',
      label: 'Room Number',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-muted)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}
          >
            {row.room_number.slice(0, 2)}
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{row.room_number}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Floor {row.floor}</div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (row) => <StatusBadge status={row.type} variant={row.type} size="sm" />
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
          <Users size={15} style={{ color: 'var(--text-dim)' }} />
          <span>{row.capacity} Seats</span>
        </div>
      )
    },
    {
      key: 'equipment',
      label: 'Equipment & Facilities',
      render: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '320px' }}>
          {row.equipment?.map((eq: string, i: number) => (
            <span
              key={i}
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              {eq}
            </span>
          ))}
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
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setEditingRoom({
                ...row,
                equipment_str: row.equipment?.join(', ')
              } as any)
            }
            style={{ padding: '6px 8px' }}
            title="Edit Room"
          >
            <Edit2 size={15} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeletingId(row.id)}
            style={{ padding: '6px 8px' }}
            title="Retire Room"
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
        data={rooms}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search room number, type, equipment..."
        searchKeys={['room_number', 'type']}
        isLoading={isLoading}
        headerAction={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Add Facility
          </Button>
        }
      />

      <RecordDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Facility / Room"
        subtitle="Add a new classroom, lab, or seminar hall to campus registry"
        fields={roomFields}
        onSubmit={handleCreate}
        submitLabel="Register Room"
      />

      {editingRoom && (
        <RecordDialog
          isOpen={true}
          onClose={() => setEditingRoom(null)}
          title={`Edit Room ${editingRoom.room_number}`}
          subtitle="Update capacity, installed equipment, or availability"
          fields={roomFields}
          initialValues={editingRoom}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Retire Facility"
        message="Are you sure you want to retire this room? All future scheduled bookings will be impacted."
      />
    </div>
  );
};
