import { z } from 'zod';

export const GrowthStageSchema = z.enum(['startup', 'growth', 'stable_expansion']);

export const GrowthCycleNoteSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  growthStage: GrowthStageSchema.nullable(),
  stageNote: z.string().nullable(),
  isLongTermSuitable: z.boolean(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type GrowthCycleNoteInput = z.infer<typeof GrowthCycleNoteSchema>;

export const GrowthCycleNoteCreateSchema = GrowthCycleNoteSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type GrowthCycleNoteCreate = z.infer<typeof GrowthCycleNoteCreateSchema>;

export const GrowthCycleNoteUpdateSchema = GrowthCycleNoteSchema.pick({
  growthStage: true,
  stageNote: true,
  isLongTermSuitable: true,
  note: true,
}).partial();

export type GrowthCycleNoteUpdate = z.infer<typeof GrowthCycleNoteUpdateSchema>;
