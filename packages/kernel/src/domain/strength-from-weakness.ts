import type { ISO8601, ULID } from './types.js';

export type BlankType = 'leave' | 'unemployed' | 'early_resign' | 'other';

export type StrengthFromWeakness = {
  id: ULID;
  weaknessLabel: string;
  blankType: BlankType | null;
  background: string;
  reframe: string;
  targetCompanyProfile: string;
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
