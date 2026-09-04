import { z } from 'zod';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] as const;

export const createScheduleSchema = z.object({
  id: z.string().optional(),
  course: z.string().min(1, 'Course code is required'),
  title: z.string().min(1, 'Course title is required'),
  day: z.enum(daysOfWeek, {
    errorMap: () => ({ message: 'Day must be one of Sunday, Monday, Tuesday, Wednesday, Thursday' })
  }),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'start_time must be HH:mm (24h)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'end_time must be HH:mm (24h)'),
  room: z.string().min(1, 'Room is required'),
  instructor: z.string().optional(),
  section: z.string().min(1, 'Section is required')
});

export const updateScheduleSchema = z.object({
  course: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  day: z.enum(daysOfWeek).optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  room: z.string().min(1).optional(),
  instructor: z.string().optional(),
  section: z.string().min(1).optional()
});
