import { z } from 'zod';

export const InterviewStageSchema = z.enum(['first', 'second', 'final', 'other']);

export const InterviewReportSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  stage: InterviewStageSchema,
  interviewerNote: z.string(),
  qaNote: z.string(),
  motivationChangeNote: z.string(),
  questionsToBringNote: z.string(),
  conductedAt: z.string().min(1).nullable(),
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
}).partial();

export type InterviewReportUpdate = z.infer<typeof InterviewReportUpdateSchema>;
