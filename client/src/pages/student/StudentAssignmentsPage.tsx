import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Input } from '../../components/common/Input';
import { assignmentService } from '../../services/assignmentService';
import { Assignment } from '@shared/types';
import { toast } from '../../store/toastStore';
import { BookOpen, Calendar, Clock, CheckCircle, ExternalLink, Search, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const StudentAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submittedIds, setSubmittedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('submitted_assignments_cache');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Submit modal state
  const [activeSubmitTask, setActiveSubmitTask] = useState<Assignment | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await assignmentService.getAll();
        setAssignments(data);
      } catch (err: any) {
        toast.error('Failed to load assignments');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmitTask) return;
    const updated = [...submittedIds, activeSubmitTask.id];
    setSubmittedIds(updated);
    localStorage.setItem('submitted_assignments_cache', JSON.stringify(updated));
    toast.success(`Milestone for "${activeSubmitTask.title}" submitted successfully!`);
    setActiveSubmitTask(null);
    setSubmissionUrl('');
  };

  const filtered = assignments.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.course.toLowerCase().includes(q) || a.title.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Coursework & Assignments
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
            Problem sets, software lab repositories, and submission milestones
          </p>
        </div>

        <div style={{ width: '280px' }}>
          <Input
            placeholder="Search coursework..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <Skeleton height="180px" />
          <Skeleton height="180px" />
          <Skeleton height="180px" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No assignments due"
          description="All coursework is up to date! Great job."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((asg) => {
            const isSubmitted = submittedIds.includes(asg.id);

            return (
              <div
                key={asg.id}
                className="glass-card animate-slide-up"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  padding: '1.5rem',
                  borderColor: isSubmitted ? 'var(--success)' : undefined
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: 'var(--accent)'
                      }}
                    >
                      {asg.course}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--glass-bg-hover)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {asg.marks ?? 100} Points
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.08rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginTop: '6px',
                      marginBottom: '6px',
                      lineHeight: 1.3
                    }}
                  >
                    {asg.title}
                  </h3>

                  {asg.description && (
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      {asg.description}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--glass-border-subtle)',
                    paddingTop: '10px'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} style={{ color: 'var(--warning)' }} /> Due {asg.deadline}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Via {asg.submission_platform}
                  </span>
                </div>

                <div>
                  {isSubmitted ? (
                    <Button
                      variant="glass"
                      size="sm"
                      disabled
                      style={{ width: '100%', color: 'var(--success)' }}
                      leftIcon={<CheckCircle2 size={16} />}
                    >
                      Submitted for Grading
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveSubmitTask(asg)}
                      style={{ width: '100%' }}
                    >
                      Submit Milestone
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      <Modal
        isOpen={!!activeSubmitTask}
        onClose={() => setActiveSubmitTask(null)}
        title="Submit Assignment Milestone"
        subtitle={`${activeSubmitTask?.course}: ${activeSubmitTask?.title}`}
        maxWidth="480px"
      >
        <form onSubmit={handleConfirmSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Provide your public GitHub repository, Drive link, or submission portal URL:
          </p>

          <Input
            label="Submission Repository / URL"
            placeholder="https://github.com/student/cse4113-project"
            value={submissionUrl}
            onChange={(e) => setSubmissionUrl(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
            <Button variant="ghost" type="button" onClick={() => setActiveSubmitTask(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Confirm Submission
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
