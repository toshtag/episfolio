import type { ISO8601, ULID } from './types.js';

export type StrengthArrowType = 'interest' | 'evaluation' | 'request';

export type StrengthArrow = {
  id: ULID;
  type: StrengthArrowType;
  description: string;
  source: string;
  occurredAt: ISO8601 | null;
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
