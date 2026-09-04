import { z } from 'zod';
import { parseToUtcDate } from '../utils/timeUtils';

const roomTypes = ['classroom', 'lab', 'seminar'] as const;
const roomStatuses = ['available', 'unavailable'] as const;

// ISO 8601 Datetime (e.g. 2026-09-07T13:00:00Z) or 24h Time string (HH:mm or HH:mm:ss)
const timeRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?|([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?)$/;

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

export const bookRoomSchema = z
  .object({
    id: z.string().optional(),
    room_id: z.string().min(1, 'room_id is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    start_time: z.string().regex(timeRegex, 'start_time must be ISO 8601 datetime (UTC) or HH:mm (24h)'),
    end_time: z.string().regex(timeRegex, 'end_time must be ISO 8601 datetime (UTC) or HH:mm (24h)'),
    booked_by: z.string().min(1, 'booked_by is required'),
    purpose: z.string().min(1, 'purpose is required')
  })
  .refine(
    (data) => {
      try {
        const start = parseToUtcDate(data.start_time, data.date);
        const end = parseToUtcDate(data.end_time, data.date);
        return end.getTime() > start.getTime();
      } catch {
        return false;
      }
    },
    {
      message: 'end_time must be strictly after start_time',
      path: ['end_time']
    }
  );

export const findAvailableRoomsSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    start_time: z.string().regex(timeRegex, 'start_time must be ISO 8601 datetime (UTC) or HH:mm (24h)'),
    end_time: z.string().regex(timeRegex, 'end_time must be ISO 8601 datetime (UTC) or HH:mm (24h)'),
    min_capacity: z.coerce.number().int().positive().optional(),
    equipment: z.array(z.string()).or(z.string().transform((s) => [s])).optional(),
    type: z.enum(roomTypes).optional()
  })
  .refine(
    (data) => {
      try {
        const start = parseToUtcDate(data.start_time, data.date);
        const end = parseToUtcDate(data.end_time, data.date);
        return end.getTime() > start.getTime();
      } catch {
        return false;
      }
    },
    {
      message: 'end_time must be strictly after start_time',
      path: ['end_time']
    }
  );

export const cancelBookingSchema = z.object({
  booked_by: z.string().optional()
});
