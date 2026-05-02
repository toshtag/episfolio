import type { ISO8601, ULID } from './episode.js';

export type BossReferenceAxis =
  | 'logicVsEmotion'
  | 'resultVsProcess'
  | 'soloVsTeam'
  | 'futureVsTradition'
  | 'sharesPrivate'
  | 'teachingSkill'
  | 'listening'
  | 'busyness';

export type BossReferenceAxisValues = Record<BossReferenceAxis, number>;

export type BossReference = {
  id: ULID;
  bossName: string | null;
  companyName: string;
  period: string;
  axisValues: BossReferenceAxisValues;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
  q5: string | null;
  q6: string | null;
  q7: string | null;
  q8: string | null;
  q9: string | null;
  q10: string | null;
  q11: string | null;
  strengthEpisode: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
