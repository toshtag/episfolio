import type { ISO8601, ULID } from './episode.js';

export type ApplicationMotive = {
  id: ULID;
  jobTargetId: ULID;
  companyFuture: string;
  contributionAction: string;
  leveragedExperience: string;
  formattedText: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
