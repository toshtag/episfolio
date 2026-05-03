import type { ISO8601, ULID } from './episode.js';

export type ResultType = 'revenue' | 'cost' | 'both';

export type ResultEntry = {
  id: ULID;
  resultType: ResultType;
  situation: string;
  action: string;
  result: string;
  quantification: string | null;
  skillType: 'outcome' | 'cause';
  note: string | null;
};

export type ResultByType = {
  id: ULID;
  title: string;
  entries: ResultEntry[];
  memo: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
