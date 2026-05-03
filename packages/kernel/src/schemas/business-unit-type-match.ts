import { z } from 'zod';

export const BusinessUnitTypeSchema = z.enum(['star', 'support', 'challenge', 'turnaround']);

export const BusinessUnitTypeMatchSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  companyUnitType: BusinessUnitTypeSchema.nullable(),
  selfType: BusinessUnitTypeSchema.nullable(),
  isMatchConfirmed: z.boolean(),
  matchNote: z.string().nullable(),
  motivationDraft: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type BusinessUnitTypeMatchInput = z.infer<typeof BusinessUnitTypeMatchSchema>;

export const BusinessUnitTypeMatchCreateSchema = BusinessUnitTypeMatchSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type BusinessUnitTypeMatchCreate = z.infer<typeof BusinessUnitTypeMatchCreateSchema>;

export const BusinessUnitTypeMatchUpdateSchema = BusinessUnitTypeMatchSchema.pick({
  companyUnitType: true,
  selfType: true,
  isMatchConfirmed: true,
  matchNote: true,
  motivationDraft: true,
  note: true,
}).partial();

export type BusinessUnitTypeMatchUpdate = z.infer<typeof BusinessUnitTypeMatchUpdateSchema>;
