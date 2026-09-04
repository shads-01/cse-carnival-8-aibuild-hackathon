import { supabase } from '../config/supabase';
import { User, CreateUserDto, UpdateUserDto, UserRole, UserStatus } from '@shared/types';
import { mapUserRowToEntity, UserDbRow } from '../models/user.model';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

// In-memory fallback mock users for dev/testing when Supabase table isn't created yet
const mockUsersStore: User[] = [
  {
    id: 'usr_admin_001',
    email: 'admin@campusos.edu',
    name: 'System Admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'usr_student_002',
    email: 'alex.dev@campusos.edu',
    name: 'Alex Johnson',
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
        return [...mockUsersStore];
      }

      if (!data || data.length === 0) {
        return [...mockUsersStore];
      }

      return (data as UserDbRow[]).map(mapUserRowToEntity);
    } catch (err) {
      logger.warn('Error fetching users from Supabase, using mock store:', err);
      return [...mockUsersStore];
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        const found = mockUsersStore.find((u) => u.id === id);
        return found || null;
      }

      return mapUserRowToEntity(data as UserDbRow);
    } catch (err) {
      const found = mockUsersStore.find((u) => u.id === id);
      return found || null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !data) {
        const found = mockUsersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
        return found || null;
      }

      return mapUserRowToEntity(data as UserDbRow);
    } catch (err) {
      const found = mockUsersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
      return found || null;
    }
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.getUserByEmail(dto.email);
    if (existing) {
      throw ApiError.conflict(`User with email ${dto.email} already exists`);
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: dto.email.toLowerCase(),
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
          role: newUser.role,
          status: newUser.status
        })
        .select()
        .single();

      if (error || !data) {
        logger.warn('Failed to insert into Supabase, storing in memory:', error?.message);
        mockUsersStore.push(newUser);
        return newUser;
      }

      return mapUserRowToEntity(data as UserDbRow);
    } catch (err) {
      mockUsersStore.push(newUser);
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
      ...(dto.email && { email: dto.email.toLowerCase() }),
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
        if (idx !== -1) mockUsersStore[idx] = updatedUser;
        return updatedUser;
      }

      return mapUserRowToEntity(data as UserDbRow);
    } catch (err) {
      const idx = mockUsersStore.findIndex((u) => u.id === id);
      if (idx !== -1) mockUsersStore[idx] = updatedUser;
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
