import { z } from 'zod';

const InfoSourceTypeSchema = z.enum([
  'recruit_info',
  'mid_term_plan',
  'president_message',
  'member_profile',
  'other',
]);

const SelfIdentificationSchema = z.enum(['fan', 'provider', 'transitioning']);

const ValueAnalysisTypeSchema = z.enum(['productOut', 'marketIn']);

const CommonSchema = z.object({
  id: z.string().min(1),
  jobTargetId: z.string().min(1),
  formattedText: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const StandardApplicationMotiveSchema = CommonSchema.extend({
  style: z.literal('standard'),
  companyFuture: z.string(),
  contributionAction: z.string(),
  leveragedExperience: z.string(),
  infoSourceType: InfoSourceTypeSchema.nullable().default(null),
  infoSourceUrl: z.string().default(''),
  targetDepartment: z.string().default(''),
  departmentChallenge: z.string().default(''),
});

export const IronApplicationMotiveSchema = CommonSchema.extend({
  style: z.literal('iron'),
  positiveInfluence: z.string().default(''),
  beforeAfterFact: z.string().default(''),
  selfIdentification: SelfIdentificationSchema.nullable().default(null),
  providerSwitchMoment: z.string().default(''),
  valueAnalysisType: ValueAnalysisTypeSchema.nullable().default(null),
  valueAnalysisDetail: z.string().default(''),
  postJoinActionPlan: z.string().default(''),
});

export const ApplicationMotiveSchema = z.discriminatedUnion('style', [
  StandardApplicationMotiveSchema,
  IronApplicationMotiveSchema,
]);

export type ApplicationMotiveInput = z.infer<typeof ApplicationMotiveSchema>;

export const ApplicationMotiveCreateSchema = z.discriminatedUnion('style', [
  StandardApplicationMotiveSchema.omit({ createdAt: true, updatedAt: true }),
  IronApplicationMotiveSchema.omit({ createdAt: true, updatedAt: true }),
]);

export type ApplicationMotiveCreate = z.infer<typeof ApplicationMotiveCreateSchema>;

const StandardUpdateSchema = StandardApplicationMotiveSchema.pick({
  companyFuture: true,
  contributionAction: true,
  leveragedExperience: true,
  formattedText: true,
  infoSourceType: true,
  infoSourceUrl: true,
  targetDepartment: true,
  departmentChallenge: true,
}).partial();

const IronUpdateSchema = IronApplicationMotiveSchema.pick({
  formattedText: true,
  positiveInfluence: true,
  beforeAfterFact: true,
  selfIdentification: true,
  providerSwitchMoment: true,
  valueAnalysisType: true,
  valueAnalysisDetail: true,
  postJoinActionPlan: true,
}).partial();

export const ApplicationMotiveUpdateSchema = z.union([StandardUpdateSchema, IronUpdateSchema]);

export type ApplicationMotiveUpdate = z.infer<typeof ApplicationMotiveUpdateSchema>;
