import { z } from 'zod';

const eventStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled', 'full'] as const;

export const createEventSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'start_time must be HH:mm (24h)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'end_time must be HH:mm (24h)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD').optional(),
  venue: z.string().min(1, 'Venue is required'),
  organizer: z.string().min(1, 'Organizer is required'),
  capacity: z.number().int().positive('Capacity must be greater than 0'),
  status: z.enum(eventStatuses).optional()
});

export const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  venue: z.string().min(1).optional(),
  organizer: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(eventStatuses).optional()
});

export const registerEventSchema = z.object({
  student_id: z.string().min(1, 'student_id is required'),
  name: z.string().min(1, 'name is required')
});
