import { z } from 'zod';

export const AgentMeetingEmailSchema = z.object({
  id: z.string().min(1),
  agentTrackRecordId: z.string().min(1).nullable(),
  subject: z.string(),
  body: z.string(),
  sentAt: z.string().min(1).nullable(),
  memo: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type AgentMeetingEmailInput = z.infer<typeof AgentMeetingEmailSchema>;

export const AgentMeetingEmailUpdateSchema = AgentMeetingEmailSchema.pick({
  agentTrackRecordId: true,
  subject: true,
  body: true,
  sentAt: true,
  memo: true,
}).partial();

export type AgentMeetingEmailUpdate = z.infer<typeof AgentMeetingEmailUpdateSchema>;
