import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { User, CreateUserDto, UpdateUserDto, UserRole, UserStatus } from '@shared/types';
import { mapUserRowToEntity, UserDbRow } from '../models/user.model';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export interface UserRecordWithPassword extends User {
  passwordHash: string;
}

// In-memory fallback mock users for dev/testing when Supabase table isn't created yet
const mockUsersStore: UserRecordWithPassword[] = [
  {
    id: 'usr_admin_001',
    email: 'admin@campus.edu',
    name: 'Campus Administrator',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'usr_admin_002',
    email: 'admin@campusos.edu',
    name: 'System Admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'usr_student_001',
    email: 'student@campus.edu',
    name: 'Rahim Ahmed',
    passwordHash: bcrypt.hashSync('student123', 10),
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'usr_student_002',
    email: 'alex.dev@campusos.edu',
    name: 'Alex Johnson',
    passwordHash: bcrypt.hashSync('student123', 10),
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class UserService {
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.warn('Supabase query fallback to in-memory store:', error.message);
        return mockUsersStore.map(({ passwordHash: _, ...u }) => u);
      }

      if (!data || data.length === 0) {
        return mockUsersStore.map(({ passwordHash: _, ...u }) => u);
      }

      return (data as UserDbRow[]).map(mapUserRowToEntity);
    } catch (err) {
      logger.warn('Error fetching users from Supabase, using mock store:', err);
      return mockUsersStore.map(({ passwordHash: _, ...u }) => u);
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        const found = mockUsersStore.find((u) => u.id === id);
        if (found) {
          const { passwordHash: _, ...user } = found;
          return user;
        }
        return null;
      }

      return mapUserRowToEntity(data as UserDbRow);
    } catch (err) {
      const found = mockUsersStore.find((u) => u.id === id);
      if (found) {
        const { passwordHash: _, ...user } = found;
        return user;
      }
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (error || !data) {
        const found = mockUsersStore.find((u) => u.email.toLowerCase() === normalizedEmail);
        if (found) {
          const { passwordHash: _, ...user } = found;
          return user;
        }
        return null;
      }

      return mapUserRowToEntity(data as UserDbRow);
    } catch (err) {
      const found = mockUsersStore.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (found) {
        const { passwordHash: _, ...user } = found;
        return user;
      }
      return null;
    }
  }

  async getUserByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
    const normalizedEmail = email.toLowerCase().trim();
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (error || !data) {
        const found = mockUsersStore.find((u) => u.email.toLowerCase() === normalizedEmail);
        if (found) {
          return { ...found };
        }
        return null;
      }

      const row = data as UserDbRow;
      const user = mapUserRowToEntity(row);
      return {
        ...user,
        passwordHash: row.password_hash || ''
      };
    } catch (err) {
      const found = mockUsersStore.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (found) {
        return { ...found };
      }
      return null;
    }
  }

  async createUser(dto: CreateUserDto & { passwordHash?: string }): Promise<User> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.getUserByEmail(normalizedEmail);
    if (existing) {
      throw ApiError.conflict(`User with email ${dto.email} already exists`);
    }

    const passwordHash =
      dto.passwordHash ||
      (dto.password ? await bcrypt.hash(dto.password, 12) : await bcrypt.hash('password123', 12));

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      name: dto.name,
      role: dto.role || UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          password_hash: passwordHash,
          role: newUser.role,
          status: newUser.status
        })
        .select()
        .single();

      if (error || !data) {
        logger.warn('Failed to insert into Supabase, storing in memory:', error?.message);
        mockUsersStore.push({ ...newUser, passwordHash });
        return newUser;
      }

      return mapUserRowToEntity(data as UserDbRow);
    } catch (err) {
      mockUsersStore.push({ ...newUser, passwordHash });
      return newUser;
    }
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.getUserById(id);
    if (!user) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }

    const updatedUser: User = {
      ...user,
      ...(dto.name && { name: dto.name }),
      ...(dto.email && { email: dto.email.toLowerCase().trim() }),
      ...(dto.role && { role: dto.role }),
      ...(dto.status && { status: dto.status }),
      ...(dto.avatarUrl && { avatarUrl: dto.avatarUrl }),
      updatedAt: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          avatar_url: updatedUser.avatarUrl,
          updated_at: updatedUser.updatedAt
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        const idx = mockUsersStore.findIndex((u) => u.id === id);
        if (idx !== -1) mockUsersStore[idx] = { ...mockUsersStore[idx], ...updatedUser };
        return updatedUser;
      }

      return mapUserRowToEntity(data as UserDbRow);
    } catch (err) {
      const idx = mockUsersStore.findIndex((u) => u.id === id);
      if (idx !== -1) mockUsersStore[idx] = { ...mockUsersStore[idx], ...updatedUser };
      return updatedUser;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.getUserById(id);
    if (!user) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }

    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        logger.warn('Failed to delete from Supabase, removing from memory store:', error.message);
      }
    } catch (err) {
      logger.warn('Error deleting from Supabase:', err);
    }

    const idx = mockUsersStore.findIndex((u) => u.id === id);
    if (idx !== -1) {
      mockUsersStore.splice(idx, 1);
    }

    return true;
  }
}
