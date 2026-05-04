import { z } from 'zod';

export const JobTargetStatusSchema = z.enum([
  'researching',
  'applying',
  'interviewing',
  'offered',
  'rejected',
  'withdrawn',
]);

export const SkillItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const EmploymentTypeSchema = z.enum(['regular', 'contract', 'dispatch', 'other']);
export const WageTypeSchema = z.enum(['monthly', 'annual', 'commission', 'other']);
export const ApplicationRouteSchema = z.enum(['direct', 'site', 'agent']);

export const JobTargetSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().min(1),
  jobTitle: z.string().min(1),
  jobDescription: z.string(),
  status: JobTargetStatusSchema,
  requiredSkills: z.array(SkillItemSchema),
  preferredSkills: z.array(SkillItemSchema),
  concerns: z.string(),
  appealPoints: z.string(),
  // 書籍 B 第 4 章 — 求人票分析フィールド（後方互換: nullable + default null）
  annualHolidays: z.number().int().nonnegative().nullable().default(null),
  workingHoursPerDay: z.number().positive().nullable().default(null),
  commuteTimeMinutes: z.number().int().nonnegative().nullable().default(null),
  employmentType: EmploymentTypeSchema.nullable().default(null),
  flexTimeAvailable: z.boolean().nullable().default(null),
  remoteWorkAvailable: z.boolean().nullable().default(null),
  averagePaidLeaveTaken: z.number().nonnegative().nullable().default(null),
  vacancyReason: z.string().nullable().default(null),
  currentTeamSize: z.number().int().positive().nullable().default(null),
  wageType: WageTypeSchema.nullable().default(null),
  basicSalary: z.number().int().nonnegative().nullable().default(null),
  fixedOvertimeHours: z.number().nonnegative().nullable().default(null),
  bonusBaseMonths: z.number().nonnegative().nullable().default(null),
  hasFutureRaisePromise: z.boolean().nullable().default(null),
  futureRaisePromiseInContract: z.boolean().nullable().default(null),
  // 書籍 B 第 3 章 — 応募経路
  applicationRoute: ApplicationRouteSchema.nullable().default(null),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type JobTargetInput = z.infer<typeof JobTargetSchema>;

export const JobTargetUpdateSchema = JobTargetSchema.pick({
  companyName: true,
  jobTitle: true,
  jobDescription: true,
  status: true,
  requiredSkills: true,
  preferredSkills: true,
  concerns: true,
  appealPoints: true,
  annualHolidays: true,
  workingHoursPerDay: true,
  commuteTimeMinutes: true,
  employmentType: true,
  flexTimeAvailable: true,
  remoteWorkAvailable: true,
  averagePaidLeaveTaken: true,
  vacancyReason: true,
  currentTeamSize: true,
  wageType: true,
  basicSalary: true,
  fixedOvertimeHours: true,
  bonusBaseMonths: true,
  hasFutureRaisePromise: true,
  futureRaisePromiseInContract: true,
  applicationRoute: true,
}).partial();

export type JobTargetUpdate = z.infer<typeof JobTargetUpdateSchema>;
