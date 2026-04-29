import type { ISO8601, ULID } from './episode.js';

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
  relatedEpisodeIds: ULID[];
  tags: string[];
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
