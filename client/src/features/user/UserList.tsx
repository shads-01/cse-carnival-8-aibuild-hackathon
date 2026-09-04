import React from 'react';
import { User } from '@shared/types';
import { UserProfileCard } from './UserProfileCard';

interface UserListProps {
  users: User[];
  loading?: boolean;
  error?: string | null;
}

export const UserList: React.FC<UserListProps> = ({ users, loading, error }) => {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading user directory...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'var(--danger)', padding: '1rem', textAlign: 'center' }}>
        Failed to load users: {error}
      </div>
    );
  }

  if (users.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>No users found.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
      {users.map((u) => (
        <UserProfileCard key={u.id} user={u} />
      ))}
    </div>
  );
};
