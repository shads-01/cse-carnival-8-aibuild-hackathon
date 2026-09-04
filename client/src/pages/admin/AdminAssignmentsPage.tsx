import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RecordDialog, FieldConfig } from '../../components/common/RecordDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { assignmentService } from '../../services/assignmentService';
import { Assignment, CreateAssignmentDto } from '@shared/types';
import { toast } from '../../store/toastStore';
import { Plus, Edit2, Trash2, BookOpen, Clock, Calendar, CheckCircle } from 'lucide-react';

const assignmentFields: FieldConfig[] = [
  { name: 'course', label: 'Course Code', type: 'text', placeholder: 'e.g. CSE 4113', required: true },
  { name: 'course_title', label: 'Course Title', type: 'text', placeholder: 'e.g. Machine Learning', required: true },
  { name: 'title', label: 'Assignment Title', type: 'text', placeholder: 'e.g. ML Classifier Benchmark Report', required: true },
  { name: 'deadline', label: 'Submission Deadline (YYYY-MM-DD)', type: 'date', required: true },
  { name: 'marks', label: 'Total Marks / Weight', type: 'number', placeholder: '100', required: true },
  {
    name: 'status',
    label: 'Publication Status',
    type: 'select',
    required: true,
    options: [
      { value: 'pending', label: 'Pending / Active' },
      { value: 'submitted', label: 'Submitted' },
      { value: 'graded', label: 'Graded' },
      { value: 'late', label: 'Late' }
    ]
  },
  { name: 'submission_platform', label: 'Submission Platform', type: 'text', placeholder: 'e.g. Google Classroom' },
  { name: 'description', label: 'Assignment Rubric & Instructions', type: 'textarea', placeholder: 'Submission requirements and grading rubric...' }
];

export const AdminAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getAll();
      setAssignments(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreate = async (values: Record<string, any>) => {
    const created = await assignmentService.create(values as CreateAssignmentDto);
    toast.success(`Published assignment "${created.title}"`);
    fetchAssignments();
  };

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingAssignment) return;
    const updated = await assignmentService.update(editingAssignment.id, values);
    toast.success(`Updated assignment "${updated.title}"`);
    fetchAssignments();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await assignmentService.delete(deletingId);
    toast.success('Assignment deleted successfully');
    setDeletingId(null);
    fetchAssignments();
  };

  const columns: Column<Assignment>[] = [
    {
      key: 'course',
      label: 'Course & Task',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.9rem' }}>
            {row.course}
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {row.title}
          </div>
        </div>
      )
    },
    {
      key: 'deadline',
      label: 'Submission Deadline',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} style={{ color: 'var(--text-dim)' }} /> {row.deadline}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Via {row.submission_platform}
          </div>
        </div>
      )
    },
    {
      key: 'marks',
      label: 'Marks',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {row.marks ?? 100} pts
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status || 'pending'} size="sm" />
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
            onClick={() => setEditingAssignment(row)}
            style={{ padding: '6px 8px' }}
            title="Edit Task"
          >
            <Edit2 size={15} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeletingId(row.id)}
            style={{ padding: '6px 8px' }}
            title="Delete Task"
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
        data={assignments}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search assignment title, course code..."
        searchKeys={['course', 'title', 'course_title']}
        isLoading={isLoading}
        headerAction={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Assign Coursework
          </Button>
        }
      />

      <RecordDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Coursework Task"
        subtitle="Publish a problem set, lab report or project milestone"
        fields={assignmentFields}
        initialValues={{ marks: 100, status: 'pending', submission_platform: 'Google Classroom' }}
        onSubmit={handleCreate}
        submitLabel="Publish Task"
      />

      {editingAssignment && (
        <RecordDialog
          isOpen={true}
          onClose={() => setEditingAssignment(null)}
          title={`Edit Task: ${editingAssignment.title}`}
          subtitle="Update submission deadline, marks weighting or instructions"
          fields={assignmentFields}
          initialValues={editingAssignment}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Coursework Task"
        message="Are you sure you want to delete this assignment? All student submission records will be purged."
      />
    </div>
  );
};
