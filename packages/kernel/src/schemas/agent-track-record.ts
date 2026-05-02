import { z } from 'zod';

export const AgentTrackRecordStatusSchema = z.enum(['active', 'archived']);

export const AgentTrackRecordSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().min(1),
  contactName: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
  firstContactDate: z.string().min(1).nullable(),
  memo: z.string(),
  status: AgentTrackRecordStatusSchema,
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
}).partial();

export type AgentTrackRecordUpdate = z.infer<typeof AgentTrackRecordUpdateSchema>;
