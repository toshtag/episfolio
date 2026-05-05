import type { ISO8601, ULID } from './types.js';

export type LifeTimelineCategory = 'education' | 'work' | 'family' | 'health' | 'hobby' | 'other';

export type LifeTimelineEntry = {
  id: ULID;
  ageRangeStart: number;
  ageRangeEnd: number;
  yearStart: number | null;
  yearEnd: number | null;
  category: LifeTimelineCategory;
  summary: string;
  detail: string;
  tags: string[];
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
