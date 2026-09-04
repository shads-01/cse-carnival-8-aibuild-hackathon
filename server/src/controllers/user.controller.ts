import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { sendResponse, ApiError } from '../utils/apiResponse';
import { HttpStatus } from '@shared/types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.userService.getAllUsers();
    sendResponse(res, HttpStatus.OK, 'Users retrieved successfully', users);
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest('User ID parameter is required');
    }

    const user = await this.userService.getUserById(id);
    if (!user) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }

    sendResponse(res, HttpStatus.OK, 'User retrieved successfully', user);
  };

  createUser = async (req: Request, res: Response): Promise<void> => {
    const user = await this.userService.createUser(req.body);
    sendResponse(res, HttpStatus.CREATED, 'User created successfully', user);
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest('User ID parameter is required');
    }

    const user = await this.userService.updateUser(id, req.body);
    sendResponse(res, HttpStatus.OK, 'User updated successfully', user);
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest('User ID parameter is required');
    }

    await this.userService.deleteUser(id);
    sendResponse(res, HttpStatus.OK, 'User deleted successfully');
  };
}
