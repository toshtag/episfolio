import type { ISO8601, ULID } from './types.js';

export type SensoryObservation = {
  category: string;
  note: string;
};

export type RecruitmentImpression = {
  id: ULID;
  jobTargetId: ULID;
  selectionProcessNote: string | null;
  officeAtmosphere: string | null;
  sensoryObservations: SensoryObservation[];
  lifestyleCompatibilityNote: string | null;
  redFlagsNote: string | null;
  overallImpression: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
