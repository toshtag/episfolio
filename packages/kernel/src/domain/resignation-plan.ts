import type { ISO8601, ULID } from './episode.js';

// 書籍 B 第 5 章（退職交渉設計・藩士意識）由来
export type RecruitmentBackground = 'vacancy' | 'expansion' | 'unknown';

export type ResignationPlan = {
  id: ULID;
  jobTargetId: ULID;
  // 内定比較表 7 項目
  annualSalary: number | null;
  annualHolidays: number | null;
  dailyWorkingHours: number | null;
  commuteMinutes: number | null;
  positionNote: string;
  recruitmentBackground: RecruitmentBackground | null;
  riskMemo: string;
  // 退職シーケンス 9 マイルストーン日付
  finalInterviewAt: ISO8601 | null;
  offerNotifiedAt: ISO8601 | null;
  offerAcceptedAt: ISO8601 | null;
  resignationNotifiedAt: ISO8601 | null;
  handoverStartedAt: ISO8601 | null;
  lastWorkingDayAt: ISO8601 | null;
  paidLeaveStartAt: ISO8601 | null;
  joinedAt: ISO8601 | null;
  // 退職交渉
  availableDateFrom: ISO8601 | null;
  availableDateTo: ISO8601 | null;
  negotiationNote: string;
  // 藩士意識（失うもの・得るもの・次の出口）
  samuraiLossNote: string;
  samuraiGainNote: string;
  nextExitPlan: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
