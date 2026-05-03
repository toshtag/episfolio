import { z } from 'zod';

export const SensoryObservationSchema = z.object({
  category: z.string(),
  note: z.string(),
});

export type SensoryObservationInput = z.infer<typeof SensoryObservationSchema>;

export const RecruitmentImpressionSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  selectionProcessNote: z.string().nullable(),
  officeAtmosphere: z.string().nullable(),
  sensoryObservations: z.array(SensoryObservationSchema),
  lifestyleCompatibilityNote: z.string().nullable(),
  redFlagsNote: z.string().nullable(),
  overallImpression: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type RecruitmentImpressionInput = z.infer<typeof RecruitmentImpressionSchema>;

export const RecruitmentImpressionCreateSchema = RecruitmentImpressionSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type RecruitmentImpressionCreate = z.infer<typeof RecruitmentImpressionCreateSchema>;

export const RecruitmentImpressionUpdateSchema = RecruitmentImpressionSchema.pick({
  selectionProcessNote: true,
  officeAtmosphere: true,
  sensoryObservations: true,
  lifestyleCompatibilityNote: true,
  redFlagsNote: true,
  overallImpression: true,
}).partial();

export type RecruitmentImpressionUpdate = z.infer<typeof RecruitmentImpressionUpdateSchema>;
