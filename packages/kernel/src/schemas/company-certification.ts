import { z } from 'zod';

export const CompanyCertificationSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  hasKurumin: z.boolean(),
  hasPlatinumKurumin: z.boolean(),
  hasTomoni: z.boolean(),
  eruboshiLevel: z.number().int().min(1).max(3).nullable(),
  hasPlatinumEruboshi: z.boolean(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type CompanyCertificationInput = z.infer<typeof CompanyCertificationSchema>;

export const CompanyCertificationCreateSchema = CompanyCertificationSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type CompanyCertificationCreate = z.infer<typeof CompanyCertificationCreateSchema>;

export const CompanyCertificationUpdateSchema = CompanyCertificationSchema.pick({
  hasKurumin: true,
  hasPlatinumKurumin: true,
  hasTomoni: true,
  eruboshiLevel: true,
  hasPlatinumEruboshi: true,
  note: true,
}).partial();

export type CompanyCertificationUpdate = z.infer<typeof CompanyCertificationUpdateSchema>;
