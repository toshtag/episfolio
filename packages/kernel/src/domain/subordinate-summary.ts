import type { ISO8601, ULID } from './episode.js';

export type SubordinateRow = {
  id: ULID;
  name: string;
  strength: string;
  achievement: string;
  teamRole: string;
  challenge: string;
  guidance: string;
  change: string;
  futureCareer: string;
};

export type SubordinateSummary = {
  id: ULID;
  title: string;
  subordinates: SubordinateRow[];
  memo: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
