import type { ISO8601, ULID } from './episode.js';

export type StrengthArrowType = 'interest' | 'evaluation' | 'request';

export type StrengthArrow = {
  id: ULID;
  type: StrengthArrowType;
  description: string;
  source: string;
  occurredAt: ISO8601 | null;
  relatedEpisodeIds: ULID[];
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
