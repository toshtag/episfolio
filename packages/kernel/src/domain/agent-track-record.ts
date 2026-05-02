import type { ISO8601, ULID } from './episode.js';

export type AgentTrackRecordStatus = 'active' | 'archived';

export type AgentTrackRecord = {
  id: ULID;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  firstContactDate: ISO8601 | null;
  memo: string;
  status: AgentTrackRecordStatus;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
