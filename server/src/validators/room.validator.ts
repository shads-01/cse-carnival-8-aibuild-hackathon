import { z } from 'zod';

const roomTypes = ['classroom', 'lab', 'seminar'] as const;
const roomStatuses = ['available', 'unavailable'] as const;

export const createRoomSchema = z.object({
  id: z.string().optional(),
  room_number: z.string().min(1, 'Room number is required'),
  type: z.enum(roomTypes, { errorMap: () => ({ message: 'type must be classroom, lab, or seminar' }) }),
  capacity: z.number().int().positive('Capacity must be greater than 0'),
  equipment: z.array(z.string()).optional(),
  floor: z.number().int(),
  status: z.enum(roomStatuses).optional()
});

export const updateRoomSchema = z.object({
  room_number: z.string().min(1).optional(),
  type: z.enum(roomTypes).optional(),
  capacity: z.number().int().positive().optional(),
  equipment: z.array(z.string()).optional(),
  floor: z.number().int().optional(),
  status: z.enum(roomStatuses).optional()
});

export const bookRoomSchema = z.object({
  id: z.string().optional(),
  room_id: z.string().min(1, 'room_id is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'start_time must be HH:mm (24h)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'end_time must be HH:mm (24h)'),
  booked_by: z.string().min(1, 'booked_by is required'),
  purpose: z.string().min(1, 'purpose is required')
});

export const findAvailableRoomsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'start_time must be HH:mm (24h)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'end_time must be HH:mm (24h)'),
  min_capacity: z.coerce.number().int().positive().optional(),
  equipment: z.array(z.string()).or(z.string().transform((s) => [s])).optional(),
  type: z.enum(roomTypes).optional()
});

export const cancelBookingSchema = z.object({
  booked_by: z.string().optional()
});
