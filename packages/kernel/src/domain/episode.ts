import type { ISO8601, ULID } from './types.js';

export type Episode = {
  id: ULID;
  title: string;
  background: string;
  problem: string;
  action: string;
  ingenuity: string;
  result: string;
  metrics: string;
  beforeAfter: string;
  reproducibility: string;
  relatedSkills: string[];
  personalFeeling: string;
  externalFeedback: string;
  remoteLLMAllowed: boolean;
  tags: string[];
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
