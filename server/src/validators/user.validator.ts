import { z } from 'zod';
import { UserRole, UserStatus } from '@shared/types';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.nativeEnum(UserRole).optional()
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').optional()
});
