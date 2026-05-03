import type { ISO8601, ULID } from './episode.js';

export type CompanyCertification = {
  id: ULID;
  jobTargetId: ULID;
  hasKurumin: boolean;
  hasPlatinumKurumin: boolean;
  hasTomoni: boolean;
  eruboshiLevel: number | null;
  hasPlatinumEruboshi: boolean;
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
