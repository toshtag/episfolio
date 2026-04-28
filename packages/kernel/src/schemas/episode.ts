import { z } from 'zod';

export const EpisodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  background: z.string(),
  problem: z.string(),
  action: z.string(),
  ingenuity: z.string(),
  result: z.string(),
  metrics: z.string(),
  beforeAfter: z.string(),
  reproducibility: z.string(),
  relatedSkills: z.array(z.string()),
  personalFeeling: z.string(),
  externalFeedback: z.string(),
  remoteLLMAllowed: z.boolean(),
  tags: z.array(z.string()),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type EpisodeInput = z.infer<typeof EpisodeSchema>;

export const EpisodeDraftSchema = EpisodeSchema.partial().required({
  title: true,
});

export type EpisodeDraft = z.infer<typeof EpisodeDraftSchema>;
