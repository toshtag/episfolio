import type { ISO8601, ULID } from './types.js';

export type InterviewQACategory = 'self-introduction' | 'motivation' | 'post-hire' | 'other';

export type InterviewQASource = 'agent-provided' | 'manual';

export type InterviewQA = {
  id: ULID;
  jobTargetId: ULID;
  category: InterviewQACategory;
  questionAsked: string;
  recommendedAnswer: string | null;
  answerToAvoid: string | null;
  questionIntent: string | null;
  orderIndex: number;
  source: InterviewQASource;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
