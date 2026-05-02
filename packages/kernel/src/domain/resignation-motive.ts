import type { ISO8601, ULID } from './episode.js';

export type ResignationMotive = {
  id: ULID;
  companyDissatisfaction: string;
  jobDissatisfaction: string;
  compensationDissatisfaction: string;
  relationshipDissatisfaction: string;
  resolutionIntent: string;
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
