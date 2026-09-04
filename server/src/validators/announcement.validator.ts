import { z } from 'zod';

const priorities = ['high', 'medium', 'low'] as const;

export const createAnnouncementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body text is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
  priority: z.enum(priorities, { errorMap: () => ({ message: 'priority must be high, medium, or low' }) }),
  posted_by: z.string().min(1, 'posted_by is required'),
  expires: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expires must be YYYY-MM-DD')
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  priority: z.enum(priorities).optional(),
  posted_by: z.string().min(1).optional(),
  expires: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});
