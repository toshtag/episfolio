import type { ISO8601, ULID } from './episode.js';

export type InterviewStage = 'first' | 'second' | 'final' | 'other';

// 視点転換 + 余白設計に基づくフィールド
export type InterviewerStyle = 'numeric' | 'process' | 'unknown';
export type ResponseImpression = 'good' | 'neutral' | 'poor';

export type InterviewReport = {
  id: ULID;
  jobTargetId: ULID;
  stage: InterviewStage;
  interviewerNote: string;
  qaNote: string;
  motivationChangeNote: string;
  questionsToBringNote: string;
  conductedAt: ISO8601 | null;
  // 余白設計・面接ログフィールド
  interviewerRole: string | null;
  interviewerStyle: InterviewerStyle | null;
  talkRatioSelf: number | null;
  questionsAskedNote: string | null;
  responseImpression: ResponseImpression | null;
  blankAreasNote: string | null;
  improvementNote: string | null;
  passed: boolean | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
