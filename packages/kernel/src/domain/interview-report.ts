import type { ISO8601, ULID } from './episode.js';

export type InterviewStage = 'first' | 'second' | 'final' | 'other';

export type InterviewReport = {
  id: ULID;
  jobTargetId: ULID;
  stage: InterviewStage;
  interviewerNote: string;
  qaNote: string;
  motivationChangeNote: string;
  questionsToBringNote: string;
  conductedAt: ISO8601 | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
