import { z } from 'zod';

export const CustomerTypeSchema = z.enum(['b2b', 'b2c']);

export const CustomerReferenceSchema = z.object({
  id: z.string().min(1),
  customerType: CustomerTypeSchema,
  customerLabel: z.string().nullable(),
  companyName: z.string().min(1),
  period: z.string().min(1),
  industry: z.string().nullable(),
  companyScale: z.string().nullable(),
  counterpartRole: z.string().nullable(),
  typicalRequests: z.string().nullable(),
  ageRange: z.string().nullable(),
  familyStatus: z.string().nullable(),
  residence: z.string().nullable(),
  incomeRange: z.string().nullable(),
  hardestExperience: z.string().nullable(),
  claimContent: z.string().nullable(),
  responseTime: z.string().nullable(),
  strengthEpisode: z.string().nullable(),
  indirectRoleIdea: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type CustomerReferenceInput = z.infer<typeof CustomerReferenceSchema>;

export const CustomerReferenceUpdateSchema = CustomerReferenceSchema.pick({
  customerType: true,
  customerLabel: true,
  companyName: true,
  period: true,
  industry: true,
  companyScale: true,
  counterpartRole: true,
  typicalRequests: true,
  ageRange: true,
  familyStatus: true,
  residence: true,
  incomeRange: true,
  hardestExperience: true,
  claimContent: true,
  responseTime: true,
  strengthEpisode: true,
  indirectRoleIdea: true,
}).partial();

export type CustomerReferenceUpdate = z.infer<typeof CustomerReferenceUpdateSchema>;
