import { z } from 'zod';

export const agentChatSchema = z.object({
  message: z.string().trim().min(1, 'message is required and must be a non-empty string'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string()
      })
    )
    .optional()
});
