import { z } from 'zod';

export const JobRequirementMappingSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  requirementSkillId: z.string().min(1),
  lifeTimelineEntryIds: z.array(z.string().min(1)),
  userNote: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type JobRequirementMappingInput = z.infer<typeof JobRequirementMappingSchema>;

export const JobRequirementMappingUpdateSchema = JobRequirementMappingSchema.pick({
  lifeTimelineEntryIds: true,
  userNote: true,
}).partial();

export type JobRequirementMappingUpdate = z.infer<typeof JobRequirementMappingUpdateSchema>;
