import { z } from 'zod';

export const LifeTimelineCategorySchema = z.enum([
  'education',
  'work',
  'family',
  'health',
  'hobby',
  'other',
]);

export const LifeTimelineEntrySchema = z
  .object({
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
  })
  .refine((data) => data.ageRangeStart <= data.ageRangeEnd, {
    message: 'ageRangeStart は ageRangeEnd 以下である必要があります',
    path: ['ageRangeStart'],
  });

export type LifeTimelineEntryInput = z.infer<typeof LifeTimelineEntrySchema>;

// Update は partial（片方だけの更新を許可するため）。両端の関係性検証は Rust 側で
// 既存値とマージしてから行う方針で、ここでは個々のフィールド型のみ守る。
export const LifeTimelineEntryUpdateSchema = z
  .object({
    ageRangeStart: z.number().int().min(0),
    ageRangeEnd: z.number().int().min(0),
    yearStart: z.number().int().nullable(),
    yearEnd: z.number().int().nullable(),
    category: LifeTimelineCategorySchema,
    summary: z.string().min(1),
    detail: z.string(),
    relatedEpisodeIds: z.array(z.string()),
    tags: z.array(z.string()),
  })
  .partial();

export type LifeTimelineEntryUpdate = z.infer<typeof LifeTimelineEntryUpdateSchema>;
