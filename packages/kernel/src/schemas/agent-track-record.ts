import { z } from 'zod';

export const AgentTrackRecordStatusSchema = z.enum(['active', 'archived']);
export const ConsultantQualitySchema = z.enum(['excellent', 'good', 'fair', 'poor']);

export const AgentTrackRecordSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().min(1),
  contactName: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
  firstContactDate: z.string().min(1).nullable(),
  memo: z.string(),
  status: AgentTrackRecordStatusSchema,
  // 多経路発想・エージェントを資産として評価するフィールド（後方互換: nullable + default null）
  specialtyIndustries: z.string().nullable().default(null),
  specialtyJobTypes: z.string().nullable().default(null),
  consultantQuality: ConsultantQualitySchema.nullable().default(null),
  hasExclusiveJobs: z.boolean().nullable().default(null),
  providesRecommendationLetter: z.boolean().nullable().default(null),
  recommendationLetterReceived: z.boolean().nullable().default(null),
  numberOfJobsIntroduced: z.number().int().nonnegative().nullable().default(null),
  responseSpeedDays: z.number().nonnegative().nullable().default(null),
  overallRating: z.number().min(1).max(5).nullable().default(null),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type AgentTrackRecordInput = z.infer<typeof AgentTrackRecordSchema>;

export const AgentTrackRecordUpdateSchema = AgentTrackRecordSchema.pick({
  companyName: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  firstContactDate: true,
  memo: true,
  status: true,
  specialtyIndustries: true,
  specialtyJobTypes: true,
  consultantQuality: true,
  hasExclusiveJobs: true,
  providesRecommendationLetter: true,
  recommendationLetterReceived: true,
  numberOfJobsIntroduced: true,
  responseSpeedDays: true,
  overallRating: true,
}).partial();

export type AgentTrackRecordUpdate = z.infer<typeof AgentTrackRecordUpdateSchema>;
