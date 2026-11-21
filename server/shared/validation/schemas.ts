import { z } from 'zod';

export const chatSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(4000),
  roleAgent: z.enum(['registrar', 'professor', 'engineer', 'biochem']).optional(),
  teamContext: z
    .object({
      taskTitle: z.string().max(200).optional(),
      projectName: z.string().max(200).optional(),
      step: z.string().max(200).optional(),
    })
    .optional(),
});

export const aiMatchSchema = z.object({
  query: z.string().trim().min(1).max(2000),
  taskId: z.string().max(100).optional(),
});

export const aiAuditSchema = z.object({
  teamData: z.record(z.string(), z.unknown()).optional(),
  query: z.string().max(4000).optional(),
});

export const pushSyncSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9-_]+$/, 'Invalid room code'),
  token: z.string().min(16).max(96).optional(),
  state: z.record(z.string(), z.unknown()),
  updatedAt: z.number().int().positive().optional(),
});

export const quizGenerateSchema = z.object({
  topic: z.string().max(200).optional(),
  articleSlug: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  roleAgent: z.enum(['registrar', 'professor', 'engineer', 'biochem']).optional(),
  count: z.number().int().min(1).max(10).optional(),
});
