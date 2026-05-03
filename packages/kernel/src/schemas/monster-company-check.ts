import { z } from 'zod';

export const ResignationEntrySchema = z.object({
  url: z.string(),
  summary: z.string(),
});

export type ResignationEntryInput = z.infer<typeof ResignationEntrySchema>;

export const MonsterCompanyCheckSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  mhlwCaseUrl: z.string().nullable(),
  violationLaw: z.string().nullable(),
  caseSummary: z.string().nullable(),
  casePublicationDate: z.string().nullable(),
  resignationEntries: z.array(ResignationEntrySchema),
  hiddenMonsterNote: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type MonsterCompanyCheckInput = z.infer<typeof MonsterCompanyCheckSchema>;

export const MonsterCompanyCheckCreateSchema = MonsterCompanyCheckSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type MonsterCompanyCheckCreate = z.infer<typeof MonsterCompanyCheckCreateSchema>;

export const MonsterCompanyCheckUpdateSchema = MonsterCompanyCheckSchema.pick({
  mhlwCaseUrl: true,
  violationLaw: true,
  caseSummary: true,
  casePublicationDate: true,
  resignationEntries: true,
  hiddenMonsterNote: true,
}).partial();

export type MonsterCompanyCheckUpdate = z.infer<typeof MonsterCompanyCheckUpdateSchema>;
