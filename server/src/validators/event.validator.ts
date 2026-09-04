import { z } from 'zod';
import { parseToUtcDate } from '../utils/timeUtils';

const eventStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled', 'full'] as const;

// ISO 8601 Datetime (e.g. 2026-09-07T13:00:00Z) or 24h Time string (HH:mm or HH:mm:ss)
const timeRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?|([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?)$/;

export const createEventSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, 'Event name is required'),
    description: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    start_time: z.string().regex(timeRegex, 'start_time must be ISO 8601 datetime (UTC) or HH:mm (24h)'),
    end_time: z.string().regex(timeRegex, 'end_time must be ISO 8601 datetime (UTC) or HH:mm (24h)'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD').optional(),
    venue: z.string().min(1, 'Venue is required'),
    organizer: z.string().min(1, 'Organizer is required'),
    capacity: z.number().int().positive('Capacity must be greater than 0'),
    status: z.enum(eventStatuses).optional()
  })
  .refine(
    (data) => {
      try {
        const start = parseToUtcDate(data.start_time, data.date);
        const end = parseToUtcDate(data.end_time, data.end_date || data.date);
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

export const updateEventSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    start_time: z.string().regex(timeRegex).optional(),
    end_time: z.string().regex(timeRegex).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    venue: z.string().min(1).optional(),
    organizer: z.string().min(1).optional(),
    capacity: z.number().int().positive().optional(),
    status: z.enum(eventStatuses).optional()
  })
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        try {
          const date = data.date || '2026-09-01';
          const start = parseToUtcDate(data.start_time, date);
          const end = parseToUtcDate(data.end_time, data.end_date || date);
          return end.getTime() > start.getTime();
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message: 'end_time must be strictly after start_time',
      path: ['end_time']
    }
  );

export const registerEventSchema = z.object({
  student_id: z.string().min(1, 'student_id is required'),
  name: z.string().min(1, 'name is required')
});
