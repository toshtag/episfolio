import { z } from 'zod';

export const AIRunInputSnapshotModeSchema = z.enum(['full', 'redacted', 'references_only']);

export const AIRunSchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  purpose: z.string().min(1),
  promptId: z.string().min(1),
  promptVersion: z.string().min(1),
  promptHash: z.string().min(1),
  modelParams: z
    .object({
      temperature: z.number().optional(),
      topP: z.number().optional(),
      seed: z.number().optional(),
    })
    .nullable(),
  inputSnapshotMode: AIRunInputSnapshotModeSchema,
  inputSnapshot: z.string().nullable(),
  inputReferences: z
    .object({
      episodeIds: z.array(z.string()).optional(),
      evidenceIds: z.array(z.string()).optional(),
    })
    .nullable(),
  outputRaw: z.string(),
  outputParsed: z.unknown(),
  parseError: z.string().nullable(),
  tokenUsage: z
    .object({
      input: z.number().int().nonnegative(),
      output: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    })
    .nullable(),
  costEstimateUSD: z.number().nonnegative().nullable(),
  createdAt: z.string().min(1),
});

export type AIRunInput = z.infer<typeof AIRunSchema>;
