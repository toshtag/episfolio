import { z } from 'zod';

export const RecruitmentBackgroundSchema = z.enum(['vacancy', 'expansion', 'unknown']);

export const ResignationPlanSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  // 内定比較表 7 項目
  annualSalary: z.number().int().min(0).nullable().default(null),
  annualHolidays: z.number().int().min(0).max(366).nullable().default(null),
  dailyWorkingHours: z.number().min(0).max(24).nullable().default(null),
  commuteMinutes: z.number().int().min(0).nullable().default(null),
  positionNote: z.string().default(''),
  recruitmentBackground: RecruitmentBackgroundSchema.nullable().default(null),
  riskMemo: z.string().default(''),
  // 退職シーケンス 9 マイルストーン日付
  finalInterviewAt: z.string().min(1).nullable().default(null),
  offerNotifiedAt: z.string().min(1).nullable().default(null),
  offerAcceptedAt: z.string().min(1).nullable().default(null),
  resignationNotifiedAt: z.string().min(1).nullable().default(null),
  handoverStartedAt: z.string().min(1).nullable().default(null),
  lastWorkingDayAt: z.string().min(1).nullable().default(null),
  paidLeaveStartAt: z.string().min(1).nullable().default(null),
  joinedAt: z.string().min(1).nullable().default(null),
  // 退職交渉
  availableDateFrom: z.string().min(1).nullable().default(null),
  availableDateTo: z.string().min(1).nullable().default(null),
  negotiationNote: z.string().default(''),
  // 藩士意識
  samuraiLossNote: z.string().default(''),
  samuraiGainNote: z.string().default(''),
  nextExitPlan: z.string().default(''),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ResignationPlanInput = z.infer<typeof ResignationPlanSchema>;

export const ResignationPlanUpdateSchema = ResignationPlanSchema.pick({
  annualSalary: true,
  annualHolidays: true,
  dailyWorkingHours: true,
  commuteMinutes: true,
  positionNote: true,
  recruitmentBackground: true,
  riskMemo: true,
  finalInterviewAt: true,
  offerNotifiedAt: true,
  offerAcceptedAt: true,
  resignationNotifiedAt: true,
  handoverStartedAt: true,
  lastWorkingDayAt: true,
  paidLeaveStartAt: true,
  joinedAt: true,
  availableDateFrom: true,
  availableDateTo: true,
  negotiationNote: true,
  samuraiLossNote: true,
  samuraiGainNote: true,
  nextExitPlan: true,
}).partial();

export type ResignationPlanUpdate = z.infer<typeof ResignationPlanUpdateSchema>;
