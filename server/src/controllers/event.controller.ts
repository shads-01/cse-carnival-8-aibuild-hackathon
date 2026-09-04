import { Request, Response } from 'express';
import { eventService } from '../services/eventService';
import { sendResponse, ApiError } from '../utils/apiResponse';
import { HttpStatus } from '@shared/types';

export class EventController {
  list = async (req: Request, res: Response): Promise<void> => {
    const filter = {
      date: req.query.date as string | undefined,
      status: req.query.status as string | undefined,
      venue: req.query.venue as string | undefined,
      organizer: req.query.organizer as string | undefined
    };
    const events = await eventService.list(filter);
    sendResponse(res, HttpStatus.OK, 'Events retrieved successfully', events);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Event ID is required');

    const event = await eventService.getById(id);
    if (!event) throw ApiError.notFound(`Event with ID "${id}" not found`);

    sendResponse(res, HttpStatus.OK, 'Event retrieved successfully', event);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const created = await eventService.create(req.body);
    sendResponse(res, HttpStatus.CREATED, 'Event created successfully', created);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Event ID is required');

    const updated = await eventService.update(id, req.body);
    sendResponse(res, HttpStatus.OK, 'Event updated successfully', updated);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Event ID is required');

    await eventService.delete(id);
    sendResponse(res, HttpStatus.OK, 'Event deleted successfully');
  };

  register = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const registerPayload = {
      ...req.body,
      event_id: id || req.body.event_id
    };

    const registration = await eventService.register(registerPayload);
    sendResponse(res, HttpStatus.CREATED, 'Student registered for event successfully', registration);
  };

  cancelRegistration = async (req: Request, res: Response): Promise<void> => {
    const { id, regId } = req.params;
    const studentIdOrRegId = regId || req.body?.student_id || req.body?.registration_id;

    if (!id || !studentIdOrRegId) {
      throw ApiError.badRequest('Event ID and Student ID (or Registration ID) are required');
    }

    await eventService.cancelRegistration(id, studentIdOrRegId);
    sendResponse(res, HttpStatus.OK, 'Event registration cancelled successfully');
  };
}

export const eventController = new EventController();
