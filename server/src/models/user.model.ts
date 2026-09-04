import { User, UserRole, UserStatus } from '@shared/types';

export interface UserDbRow {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  role: string;
  status: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const mapUserRowToEntity = (row: UserDbRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: (row.role as UserRole) || UserRole.USER,
  status: (row.status as UserStatus) || UserStatus.ACTIVE,
  avatarUrl: row.avatar_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});
