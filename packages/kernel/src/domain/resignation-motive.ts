import type { ISO8601, ULID } from './types.js';

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
