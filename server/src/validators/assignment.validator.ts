import { z } from 'zod';

const assignmentStatuses = ['pending', 'submitted', 'graded', 'late'] as const;

export const createAssignmentSchema = z.object({
  id: z.string().optional(),
  course: z.string().min(1, 'Course code is required'),
  course_title: z.string().min(1, 'Course title is required'),
  title: z.string().min(1, 'Assignment title is required'),
  description: z.string().optional(),
  assigned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'assigned_date must be YYYY-MM-DD').optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'deadline must be YYYY-MM-DD'),
  submission_platform: z.string().min(1, 'submission_platform is required'),
  status: z.enum(assignmentStatuses).optional(),
  marks: z.number().int().min(0, 'Marks must be greater than or equal to 0')
});

export const updateAssignmentSchema = z.object({
  course: z.string().min(1).optional(),
  course_title: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assigned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  submission_platform: z.string().min(1).optional(),
  status: z.enum(assignmentStatuses).optional(),
  marks: z.number().int().min(0).optional()
});
