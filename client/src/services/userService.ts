import { apiClient } from './api';
import { User, CreateUserDto, UpdateUserDto, ApiResponse } from '@shared/types';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/users');
    return response.data.data || [];
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    if (!response.data.data) throw new Error('User not found');
    return response.data.data;
  },

  createUser: async (dto: CreateUserDto): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>('/users', dto);
    if (!response.data.data) throw new Error('Failed to create user');
    return response.data.data;
  },

  updateUser: async (id: string, dto: UpdateUserDto): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, dto);
    if (!response.data.data) throw new Error('Failed to update user');
    return response.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/users/${id}`);
  }
};
