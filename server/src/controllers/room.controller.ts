import { Request, Response } from 'express';
import { roomService } from '../services/roomService';
import { sendResponse, ApiError } from '../utils/apiResponse';
import { HttpStatus } from '@shared/types';

export class RoomController {
  list = async (req: Request, res: Response): Promise<void> => {
    const filter = {
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      min_capacity: req.query.min_capacity ? Number(req.query.min_capacity) : undefined
    };
    const rooms = await roomService.list(filter);
    sendResponse(res, HttpStatus.OK, 'Rooms retrieved successfully', rooms);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Room ID is required');

    const room = await roomService.getById(id);
    if (!room) throw ApiError.notFound(`Room with ID "${id}" not found`);

    sendResponse(res, HttpStatus.OK, 'Room retrieved successfully', room);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const created = await roomService.create(req.body);
    sendResponse(res, HttpStatus.CREATED, 'Room created successfully', created);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Room ID is required');

    const updated = await roomService.update(id, req.body);
    sendResponse(res, HttpStatus.OK, 'Room updated successfully', updated);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Room ID is required');

    await roomService.delete(id);
    sendResponse(res, HttpStatus.OK, 'Room deleted successfully');
  };

  findAvailable = async (req: Request, res: Response): Promise<void> => {
    const { date, start_time, end_time, min_capacity, equipment, type } = req.query;

    const equipmentList = equipment
      ? Array.isArray(equipment)
        ? (equipment as string[])
        : (equipment as string).split(',').map((s) => s.trim())
      : undefined;

    const available = await roomService.findAvailable({
      date: date as string,
      start_time: start_time as string,
      end_time: end_time as string,
      min_capacity: min_capacity ? Number(min_capacity) : undefined,
      equipment: equipmentList,
      type: type as any
    });

    sendResponse(res, HttpStatus.OK, 'Available rooms retrieved successfully', available);
  };

  book = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const bookingPayload = {
      ...req.body,
      room_id: id || req.body.room_id
    };

    const booking = await roomService.book(bookingPayload);
    sendResponse(res, HttpStatus.CREATED, 'Room booked successfully', booking);
  };

  cancelBooking = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Booking ID is required');

    const bookedBy = req.body?.booked_by || (req.query?.booked_by as string | undefined);
    await roomService.cancelBooking(id, bookedBy);
    sendResponse(res, HttpStatus.OK, 'Booking cancelled successfully');
  };
}

export const roomController = new RoomController();
