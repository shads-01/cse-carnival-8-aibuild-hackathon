import { Request, Response } from 'express';
import { scheduleService } from '../services/scheduleService';
import { sendResponse, ApiError } from '../utils/apiResponse';
import { HttpStatus } from '@shared/types';

export class ScheduleController {
  list = async (req: Request, res: Response): Promise<void> => {
    const filter = {
      course: req.query.course as string | undefined,
      day: req.query.day as string | undefined,
      room: req.query.room as string | undefined,
      instructor: req.query.instructor as string | undefined,
      section: req.query.section as string | undefined
    };
    const schedules = await scheduleService.list(filter);
    sendResponse(res, HttpStatus.OK, 'Schedules retrieved successfully', schedules);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Schedule ID is required');

    const schedule = await scheduleService.getById(id);
    if (!schedule) throw ApiError.notFound(`Schedule with ID "${id}" not found`);

    sendResponse(res, HttpStatus.OK, 'Schedule retrieved successfully', schedule);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const created = await scheduleService.create(req.body);
    sendResponse(res, HttpStatus.CREATED, 'Schedule created successfully', created);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Schedule ID is required');

    const updated = await scheduleService.update(id, req.body);
    sendResponse(res, HttpStatus.OK, 'Schedule updated successfully', updated);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Schedule ID is required');

    await scheduleService.delete(id);
    sendResponse(res, HttpStatus.OK, 'Schedule deleted successfully');
  };
}

export const scheduleController = new ScheduleController();
