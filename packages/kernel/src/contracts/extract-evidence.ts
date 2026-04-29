import { z } from 'zod';

export const ExtractEvidenceInputSchema = z.object({
  systemPrompt: z.string().min(1),
  userPrompt: z.string().min(1),
});

export type ExtractEvidenceInput = z.infer<typeof ExtractEvidenceInputSchema>;

export const ExtractEvidenceCandidateSchema = z.object({
  strengthLabel: z.string().min(1),
  description: z.string().min(1),
  evidenceEpisodeIds: z.array(z.string()),
  reproducibility: z.string(),
  evaluatedContext: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
});

export const ExtractEvidenceOutputSchema = z.object({
  candidates: z.array(ExtractEvidenceCandidateSchema),
});

export type ExtractEvidenceOutput = z.infer<typeof ExtractEvidenceOutputSchema>;
export type ExtractEvidenceCandidate = z.infer<typeof ExtractEvidenceCandidateSchema>;
