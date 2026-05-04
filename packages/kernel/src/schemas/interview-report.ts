import { z } from 'zod';

export const InterviewStageSchema = z.enum(['first', 'second', 'final', 'other']);

export const InterviewerStyleSchema = z.enum(['numeric', 'process', 'unknown']);

export const ResponseImpressionSchema = z.enum(['good', 'neutral', 'poor']);

export const InterviewReportSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  stage: InterviewStageSchema,
  interviewerNote: z.string(),
  qaNote: z.string(),
  motivationChangeNote: z.string(),
  questionsToBringNote: z.string(),
  conductedAt: z.string().min(1).nullable(),
  interviewerRole: z.string().nullable().default(null),
  interviewerStyle: InterviewerStyleSchema.nullable().default(null),
  talkRatioSelf: z.number().min(0).max(100).nullable().default(null),
  questionsAskedNote: z.string().nullable().default(null),
  responseImpression: ResponseImpressionSchema.nullable().default(null),
  blankAreasNote: z.string().nullable().default(null),
  improvementNote: z.string().nullable().default(null),
  passed: z.boolean().nullable().default(null),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type InterviewReportInput = z.infer<typeof InterviewReportSchema>;

export const InterviewReportUpdateSchema = InterviewReportSchema.pick({
  stage: true,
  interviewerNote: true,
  qaNote: true,
  motivationChangeNote: true,
  questionsToBringNote: true,
  conductedAt: true,
  interviewerRole: true,
  interviewerStyle: true,
  talkRatioSelf: true,
  questionsAskedNote: true,
  responseImpression: true,
  blankAreasNote: true,
  improvementNote: true,
  passed: true,
}).partial();

export type InterviewReportUpdate = z.infer<typeof InterviewReportUpdateSchema>;
