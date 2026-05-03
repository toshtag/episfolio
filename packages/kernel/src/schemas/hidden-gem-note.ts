import { z } from 'zod';

export const HiddenGemNoteSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  isGntListed: z.boolean(),
  nicheKeywords: z.string().nullable(),
  hasAntiMonsterMechanism: z.boolean(),
  mechanismNote: z.string().nullable(),
  isHiringOnJobSites: z.boolean(),
  directContactNote: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type HiddenGemNoteInput = z.infer<typeof HiddenGemNoteSchema>;

export const HiddenGemNoteCreateSchema = HiddenGemNoteSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type HiddenGemNoteCreate = z.infer<typeof HiddenGemNoteCreateSchema>;

export const HiddenGemNoteUpdateSchema = HiddenGemNoteSchema.pick({
  isGntListed: true,
  nicheKeywords: true,
  hasAntiMonsterMechanism: true,
  mechanismNote: true,
  isHiringOnJobSites: true,
  directContactNote: true,
  note: true,
}).partial();

export type HiddenGemNoteUpdate = z.infer<typeof HiddenGemNoteUpdateSchema>;
