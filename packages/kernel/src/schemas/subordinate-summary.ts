import { z } from 'zod';

export const SubordinateRowSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  strength: z.string(),
  achievement: z.string(),
  teamRole: z.string(),
  challenge: z.string(),
  guidance: z.string(),
  change: z.string(),
  futureCareer: z.string(),
});

export type SubordinateRowInput = z.infer<typeof SubordinateRowSchema>;

export const SubordinateSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  subordinates: z.array(SubordinateRowSchema),
  memo: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type SubordinateSummaryInput = z.infer<typeof SubordinateSummarySchema>;

export const SubordinateSummaryCreateSchema = SubordinateSummarySchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type SubordinateSummaryCreate = z.infer<typeof SubordinateSummaryCreateSchema>;

export const SubordinateSummaryUpdateSchema = SubordinateSummarySchema.pick({
  title: true,
  subordinates: true,
  memo: true,
}).partial();

export type SubordinateSummaryUpdate = z.infer<typeof SubordinateSummaryUpdateSchema>;
