import type { ISO8601, ULID } from './episode.js';

export type AgentTrackRecordStatus = 'active' | 'archived';
export type ConsultantQuality = 'excellent' | 'good' | 'fair' | 'poor';

export type AgentTrackRecord = {
  id: ULID;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  firstContactDate: ISO8601 | null;
  memo: string;
  status: AgentTrackRecordStatus;
  // 書籍 B 第 3 章 — 多経路発想・エージェントを資産として評価するフィールド
  specialtyIndustries: string | null;
  specialtyJobTypes: string | null;
  consultantQuality: ConsultantQuality | null;
  hasExclusiveJobs: boolean | null;
  providesRecommendationLetter: boolean | null;
  recommendationLetterReceived: boolean | null;
  numberOfJobsIntroduced: number | null;
  responseSpeedDays: number | null;
  overallRating: number | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
