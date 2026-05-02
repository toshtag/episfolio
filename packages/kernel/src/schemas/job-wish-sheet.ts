import { z } from 'zod';

export const JobWishCompanySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  note: z.string(),
});

export type JobWishCompanyInput = z.infer<typeof JobWishCompanySchema>;

export const JobWishSheetSchema = z.object({
  id: z.string().min(1),
  agentTrackRecordId: z.string().min(1).nullable(),
  title: z.string(),
  desiredIndustry: z.string(),
  desiredRole: z.string(),
  desiredSalary: z.string(),
  desiredLocation: z.string(),
  desiredWorkStyle: z.string(),
  otherConditions: z.string(),
  groupACompanies: z.array(JobWishCompanySchema),
  groupBCompanies: z.array(JobWishCompanySchema),
  groupCCompanies: z.array(JobWishCompanySchema),
  memo: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type JobWishSheetInput = z.infer<typeof JobWishSheetSchema>;

export const JobWishSheetCreateSchema = JobWishSheetSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type JobWishSheetCreate = z.infer<typeof JobWishSheetCreateSchema>;

export const JobWishSheetUpdateSchema = JobWishSheetSchema.pick({
  agentTrackRecordId: true,
  title: true,
  desiredIndustry: true,
  desiredRole: true,
  desiredSalary: true,
  desiredLocation: true,
  desiredWorkStyle: true,
  otherConditions: true,
  groupACompanies: true,
  groupBCompanies: true,
  groupCCompanies: true,
  memo: true,
}).partial();

export type JobWishSheetUpdate = z.infer<typeof JobWishSheetUpdateSchema>;
