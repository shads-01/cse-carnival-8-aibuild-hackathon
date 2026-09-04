import { Request, Response } from 'express';
import { announcementService } from '../services/announcementService';
import { sendResponse, ApiError } from '../utils/apiResponse';
import { HttpStatus } from '@shared/types';

export class AnnouncementController {
  list = async (req: Request, res: Response): Promise<void> => {
    const filter = {
      priority: req.query.priority as string | undefined,
      posted_by: req.query.posted_by as string | undefined,
      unexpired_only: req.query.unexpired_only === 'true'
    };
    const announcements = await announcementService.list(filter);
    sendResponse(res, HttpStatus.OK, 'Announcements retrieved successfully', announcements);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Announcement ID is required');

    const announcement = await announcementService.getById(id);
    if (!announcement) throw ApiError.notFound(`Announcement with ID "${id}" not found`);

    sendResponse(res, HttpStatus.OK, 'Announcement retrieved successfully', announcement);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const created = await announcementService.create(req.body);
    sendResponse(res, HttpStatus.CREATED, 'Announcement created successfully', created);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Announcement ID is required');

    const updated = await announcementService.update(id, req.body);
    sendResponse(res, HttpStatus.OK, 'Announcement updated successfully', updated);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Announcement ID is required');

    await announcementService.delete(id);
    sendResponse(res, HttpStatus.OK, 'Announcement deleted successfully');
  };
}

export const announcementController = new AnnouncementController();
