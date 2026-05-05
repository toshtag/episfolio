import type { ISO8601, ULID } from './types.js';

export type HiddenGemNote = {
  id: ULID;
  jobTargetId: ULID;
  isGntListed: boolean;
  nicheKeywords: string | null;
  hasAntiMonsterMechanism: boolean;
  mechanismNote: string | null;
  isHiringOnJobSites: boolean;
  directContactNote: string | null;
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
