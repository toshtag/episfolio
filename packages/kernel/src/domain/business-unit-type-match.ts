import type { ISO8601, ULID } from './episode.js';

export type BusinessUnitType = 'star' | 'support' | 'challenge' | 'turnaround';

export type BusinessUnitTypeMatch = {
  id: ULID;
  jobTargetId: ULID;
  companyUnitType: BusinessUnitType | null;
  selfType: BusinessUnitType | null;
  isMatchConfirmed: boolean;
  matchNote: string | null;
  motivationDraft: string | null;
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
