import { z } from 'zod';

export const ResignationMotiveSchema = z.object({
  id: z.string().min(1),
  companyDissatisfaction: z.string(),
  jobDissatisfaction: z.string(),
  compensationDissatisfaction: z.string(),
  relationshipDissatisfaction: z.string(),
  resolutionIntent: z.string(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ResignationMotiveInput = z.infer<typeof ResignationMotiveSchema>;

export const ResignationMotiveCreateSchema = ResignationMotiveSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type ResignationMotiveCreate = z.infer<typeof ResignationMotiveCreateSchema>;

export const ResignationMotiveUpdateSchema = ResignationMotiveSchema.pick({
  companyDissatisfaction: true,
  jobDissatisfaction: true,
  compensationDissatisfaction: true,
  relationshipDissatisfaction: true,
  resolutionIntent: true,
  note: true,
}).partial();

export type ResignationMotiveUpdate = z.infer<typeof ResignationMotiveUpdateSchema>;
