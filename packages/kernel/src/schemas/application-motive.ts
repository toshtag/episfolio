import { z } from 'zod';

export const ApplicationMotiveSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  companyFuture: z.string(),
  contributionAction: z.string(),
  leveragedExperience: z.string(),
  formattedText: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ApplicationMotiveInput = z.infer<typeof ApplicationMotiveSchema>;

export const ApplicationMotiveCreateSchema = ApplicationMotiveSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type ApplicationMotiveCreate = z.infer<typeof ApplicationMotiveCreateSchema>;

export const ApplicationMotiveUpdateSchema = ApplicationMotiveSchema.pick({
  companyFuture: true,
  contributionAction: true,
  leveragedExperience: true,
  formattedText: true,
}).partial();

export type ApplicationMotiveUpdate = z.infer<typeof ApplicationMotiveUpdateSchema>;
