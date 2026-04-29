import { z } from 'zod';

export const LifeTimelineCategorySchema = z.enum([
  'education',
  'work',
  'family',
  'health',
  'hobby',
  'other',
]);

export const LifeTimelineEntrySchema = z.object({
  id: z.string().min(1),
  ageRangeStart: z.number().int().min(0),
  ageRangeEnd: z.number().int().min(0),
  yearStart: z.number().int().nullable(),
  yearEnd: z.number().int().nullable(),
  category: LifeTimelineCategorySchema,
  summary: z.string().min(1),
  detail: z.string(),
  relatedEpisodeIds: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type LifeTimelineEntryInput = z.infer<typeof LifeTimelineEntrySchema>;

export const LifeTimelineEntryUpdateSchema = LifeTimelineEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type LifeTimelineEntryUpdate = z.infer<typeof LifeTimelineEntryUpdateSchema>;
