import type { ISO8601, ULID } from './episode.js';

export type JobRequirementMapping = {
  id: ULID;
  jobTargetId: ULID;
  requirementSkillId: string;
  episodeIds: ULID[];
  userNote: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
