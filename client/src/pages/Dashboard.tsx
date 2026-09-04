import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { userService } from '../services/userService';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardOverview } from '../features/dashboard/DashboardOverview';
import { UserList } from '../features/user/UserList';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { UserRole } from '@shared/types';
import { UserPlus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: users, loading, error, refetch } = useFetch(userService.getUsers);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      await userService.createUser({
        email: newEmail,
        name: newName,
        role: UserRole.USER
      });
      setNewEmail('');
      setNewName('');
      setIsModalOpen(false);
      await refetch();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '2rem' }}>
        <DashboardOverview user={user} totalUsers={users?.length || 0} />

        <div
          style={{
            marginTop: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>User Management Directory</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Real-time user accounts managed via backend service layer & Supabase database
            </p>
          </div>

          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <UserPlus size={16} style={{ marginRight: '6px' }} /> Add New User
          </Button>
        </div>

        <UserList users={users || []} loading={loading} error={error} />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New System User"
        >
          {createError && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: '1rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--danger)',
                fontSize: '0.85rem'
              }}
            >
              {createError}
            </div>
          )}
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Full Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Marcus Vance"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. marcus@campusos.edu"
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createLoading}>
                Save User
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
