import { z } from 'zod';

export const InterviewQACategorySchema = z.enum([
  'self-introduction',
  'motivation',
  'post-hire',
  'other',
]);

export const InterviewQASourceSchema = z.enum(['agent-provided', 'manual']);

export const InterviewQASchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  category: InterviewQACategorySchema,
  questionAsked: z.string().min(1),
  recommendedAnswer: z.string().nullable(),
  answerToAvoid: z.string().nullable(),
  questionIntent: z.string().nullable(),
  orderIndex: z.number().int().min(0),
  source: InterviewQASourceSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type InterviewQAInput = z.infer<typeof InterviewQASchema>;

export const InterviewQAUpdateSchema = InterviewQASchema.pick({
  category: true,
  questionAsked: true,
  recommendedAnswer: true,
  answerToAvoid: true,
  questionIntent: true,
  orderIndex: true,
  source: true,
}).partial();

export type InterviewQAUpdate = z.infer<typeof InterviewQAUpdateSchema>;
