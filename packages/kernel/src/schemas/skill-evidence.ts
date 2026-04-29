import { z } from 'zod';

export const SkillEvidenceConfidenceSchema = z.enum(['low', 'medium', 'high']);
export const SkillEvidenceStatusSchema = z.enum(['candidate', 'accepted', 'rejected']);

export const SkillEvidenceSchema = z.object({
  id: z.string().min(1),
  strengthLabel: z.string().min(1),
  description: z.string().min(1),
  evidenceEpisodeIds: z.array(z.string()),
  reproducibility: z.string(),
  evaluatedContext: z.string(),
  confidence: SkillEvidenceConfidenceSchema,
  status: SkillEvidenceStatusSchema,
  createdBy: z.enum(['human', 'ai']),
  sourceAIRunId: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type SkillEvidenceInput = z.infer<typeof SkillEvidenceSchema>;

export const SkillEvidenceUpdateSchema = SkillEvidenceSchema.pick({
  strengthLabel: true,
  description: true,
  reproducibility: true,
  evaluatedContext: true,
  confidence: true,
  status: true,
}).partial();

export type SkillEvidenceUpdate = z.infer<typeof SkillEvidenceUpdateSchema>;
