import { z } from 'zod';

export const JobTargetStatusSchema = z.enum([
  'researching',
  'applying',
  'interviewing',
  'offered',
  'rejected',
  'withdrawn',
]);

export const SkillItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const JobTargetSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().min(1),
  jobTitle: z.string().min(1),
  jobDescription: z.string(),
  status: JobTargetStatusSchema,
  requiredSkills: z.array(SkillItemSchema),
  preferredSkills: z.array(SkillItemSchema),
  concerns: z.string(),
  appealPoints: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type JobTargetInput = z.infer<typeof JobTargetSchema>;

export const JobTargetUpdateSchema = JobTargetSchema.pick({
  companyName: true,
  jobTitle: true,
  jobDescription: true,
  status: true,
  requiredSkills: true,
  preferredSkills: true,
  concerns: true,
  appealPoints: true,
}).partial();

export type JobTargetUpdate = z.infer<typeof JobTargetUpdateSchema>;
