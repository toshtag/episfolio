import type { ISO8601, ULID } from './types.js';

export type GrowthStage = 'startup' | 'growth' | 'stable_expansion';

export type GrowthCycleNote = {
  id: ULID;
  jobTargetId: ULID;
  growthStage: GrowthStage | null;
  stageNote: string | null;
  isLongTermSuitable: boolean;
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
