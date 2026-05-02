import type { ISO8601, ULID } from './episode.js';

export type AgentMeetingEmail = {
  id: ULID;
  agentTrackRecordId: ULID | null;
  subject: string;
  body: string;
  sentAt: ISO8601 | null;
  memo: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
