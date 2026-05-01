import type { ISO8601, ULID } from './episode.js';

export type JobTargetStatus =
  | 'researching'
  | 'applying'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'withdrawn';

export type SkillItem = {
  id: ULID;
  text: string;
};

export type JobTarget = {
  id: ULID;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: JobTargetStatus;
  requiredSkills: SkillItem[];
  preferredSkills: SkillItem[];
  concerns: string;
  appealPoints: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
