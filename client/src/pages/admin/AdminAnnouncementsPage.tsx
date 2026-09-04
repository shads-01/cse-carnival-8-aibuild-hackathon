import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RecordDialog, FieldConfig } from '../../components/common/RecordDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { announcementService } from '../../services/announcementService';
import { Announcement, CreateAnnouncementDto } from '@shared/types';
import { toast } from '../../store/toastStore';
import { Plus, Edit2, Trash2, Megaphone, Calendar, User } from 'lucide-react';

const announcementFields: FieldConfig[] = [
  { name: 'title', label: 'Announcement Title', type: 'text', placeholder: 'e.g. Midterm Examination Schedule', required: true },
  { name: 'posted_by', label: 'Issuing Authority / Office', type: 'text', placeholder: 'e.g. Controller of Examinations', required: true },
  {
    name: 'priority',
    label: 'Priority Level',
    type: 'select',
    required: true,
    options: [
      { value: 'high', label: 'High Priority' },
      { value: 'medium', label: 'Medium Priority' },
      { value: 'low', label: 'Low / Information' }
    ]
  },
  { name: 'date', label: 'Publication Date (YYYY-MM-DD)', type: 'date', required: true },
  { name: 'expires', label: 'Expiration Date (YYYY-MM-DD)', type: 'date', required: true },
  { name: 'body', label: 'Full Notice Content', type: 'textarea', placeholder: 'Official announcement body...', required: true }
];

export const AdminAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await announcementService.getAll();
      setAnnouncements(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch announcements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (values: Record<string, any>) => {
    const created = await announcementService.create(values as CreateAnnouncementDto);
    toast.success(`Published notice: ${created.title}`);
    fetchAnnouncements();
  };

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingAnnouncement) return;
    const updated = await announcementService.update(editingAnnouncement.id, values);
    toast.success(`Updated notice: ${updated.title}`);
    fetchAnnouncements();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await announcementService.delete(deletingId);
    toast.success('Announcement removed');
    setDeletingId(null);
    fetchAnnouncements();
  };

  const columns: Column<Announcement>[] = [
    {
      key: 'title',
      label: 'Notice & Content Preview',
      sortable: true,
      render: (row) => (
        <div style={{ maxWidth: '420px' }}>
          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {row.title}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginTop: '3px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {row.body}
          </div>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (row) => <StatusBadge status={row.priority} size="sm" />
    },
    {
      key: 'posted_by',
      label: 'Issued By & Date',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{row.posted_by}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            {row.date}
          </div>
        </div>
      )
    },
    {
      key: 'expires',
      label: 'Expires',
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {row.expires}
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
            onClick={() => setEditingAnnouncement(row)}
            style={{ padding: '6px 8px' }}
            title="Edit Notice"
          >
            <Edit2 size={15} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeletingId(row.id)}
            style={{ padding: '6px 8px' }}
            title="Delete Notice"
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
        data={announcements}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search announcements, circulars, authority..."
        searchKeys={['title', 'body', 'posted_by', 'priority']}
        isLoading={isLoading}
        headerAction={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Post Notice
          </Button>
        }
      />

      <RecordDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Issue Official Campus Notice"
        subtitle="Broadcast an official circular to faculty and student body"
        fields={announcementFields}
        initialValues={{
          date: new Date().toISOString().split('T')[0],
          expires: '2026-12-31',
          priority: 'medium'
        }}
        onSubmit={handleCreate}
        submitLabel="Post Circular"
      />

      {editingAnnouncement && (
        <RecordDialog
          isOpen={true}
          onClose={() => setEditingAnnouncement(null)}
          title={`Edit Notice: ${editingAnnouncement.title}`}
          subtitle="Modify announcement body, priority or expiration"
          fields={announcementFields}
          initialValues={editingAnnouncement}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Revoke Announcement"
        message="Are you sure you want to remove this official circular from the broadcast board?"
      />
    </div>
  );
};
