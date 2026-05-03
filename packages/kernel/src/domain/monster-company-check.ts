import type { ISO8601, ULID } from './episode.js';

export type ResignationEntry = {
  url: string;
  summary: string;
};

export type MonsterCompanyCheck = {
  id: ULID;
  jobTargetId: ULID;
  mhlwCaseUrl: string | null;
  violationLaw: string | null;
  caseSummary: string | null;
  casePublicationDate: string | null;
  resignationEntries: ResignationEntry[];
  hiddenMonsterNote: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
