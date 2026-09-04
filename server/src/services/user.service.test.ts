import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './user.service';
import { UserRole, UserStatus } from '@shared/types';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should fetch all users successfully', async () => {
    const users = await userService.getAllUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  it('should retrieve a user by email', async () => {
    const user = await userService.getUserByEmail('admin@campusos.edu');
    expect(user).not.toBeNull();
    expect(user?.email).toBe('admin@campusos.edu');
  });

  it('should create a new user entity', async () => {
    const newDto = {
      email: `test_${Date.now()}@campusos.edu`,
      name: 'Test Runner',
      role: UserRole.USER
    };

    const created = await userService.createUser(newDto);
    expect(created).toBeDefined();
    expect(created.email).toBe(newDto.email);
    expect(created.name).toBe('Test Runner');
    expect(created.status).toBe(UserStatus.ACTIVE);
  });
});
