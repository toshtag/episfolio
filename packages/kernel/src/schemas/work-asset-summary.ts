import { z } from 'zod';

export const AssetTypeSchema = z.enum([
  'proposal',
  'source-code',
  'slide',
  'minutes',
  'weekly-report',
  'comparison-table',
  'document',
  'other',
]);

export const WorkAssetSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  assetType: AssetTypeSchema,
  jobContext: z.string().nullable(),
  period: z.string().nullable(),
  role: z.string().nullable(),
  summary: z.string().nullable(),
  strengthEpisode: z.string().nullable(),
  talkingPoints: z.string().nullable(),
  maskingNote: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type WorkAssetSummaryInput = z.infer<typeof WorkAssetSummarySchema>;

export const WorkAssetSummaryUpdateSchema = WorkAssetSummarySchema.pick({
  title: true,
  assetType: true,
  jobContext: true,
  period: true,
  role: true,
  summary: true,
  strengthEpisode: true,
  talkingPoints: true,
  maskingNote: true,
}).partial();

export type WorkAssetSummaryUpdate = z.infer<typeof WorkAssetSummaryUpdateSchema>;
