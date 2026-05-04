import { describe, expect, it } from 'vitest';
import {
  AgentTrackRecordSchema,
  AgentTrackRecordStatusSchema,
  AgentTrackRecordUpdateSchema,
  ConsultantQualitySchema,
} from '../../src/schemas/agent-track-record.js';

const baseRecord = {
  id: '01AGENT1',
  companyName: 'リクルートエージェント',
  contactName: '田中 太郎',
  contactEmail: 'tanaka@example.com',
  contactPhone: '03-0000-0000',
  firstContactDate: '2026-05-01T00:00:00Z',
  memo: '初回面談済み',
  status: 'active' as const,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
};

describe('AgentTrackRecordStatusSchema', () => {
  it.each(['active', 'archived'])('%s を受理', (status) => {
    expect(AgentTrackRecordStatusSchema.safeParse(status).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(AgentTrackRecordStatusSchema.safeParse('inactive').success).toBe(false);
    expect(AgentTrackRecordStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('ConsultantQualitySchema', () => {
  it.each(['excellent', 'good', 'fair', 'poor'])('%s を受理', (v) => {
    expect(ConsultantQualitySchema.safeParse(v).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(ConsultantQualitySchema.safeParse('bad').success).toBe(false);
    expect(ConsultantQualitySchema.safeParse('').success).toBe(false);
  });
});

describe('AgentTrackRecordSchema', () => {
  it('正常系', () => {
    expect(AgentTrackRecordSchema.safeParse(baseRecord).success).toBe(true);
  });

  it('firstContactDate が null でも受理', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, firstContactDate: null }).success,
    ).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, id: '' }).success).toBe(false);
  });

  it('companyName 空文字を拒否', () => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, companyName: '' }).success).toBe(
      false,
    );
  });

  it('contactName / contactEmail / contactPhone / memo は空文字を許可', () => {
    expect(
      AgentTrackRecordSchema.safeParse({
        ...baseRecord,
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        memo: '',
      }).success,
    ).toBe(true);
  });

  it('firstContactDate 空文字を拒否（null か非空文字のみ）', () => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, firstContactDate: '' }).success).toBe(
      false,
    );
  });

  it('未知の status を拒否', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, status: 'inactive' as 'active' }).success,
    ).toBe(false);
  });

  // --- 後方互換：新フィールドが省略されると null にデフォルト ---

  it('新フィールドが全て省略されると null にデフォルト', () => {
    const result = AgentTrackRecordSchema.safeParse(baseRecord);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.specialtyIndustries).toBeNull();
    expect(result.data.specialtyJobTypes).toBeNull();
    expect(result.data.consultantQuality).toBeNull();
    expect(result.data.hasExclusiveJobs).toBeNull();
    expect(result.data.providesRecommendationLetter).toBeNull();
    expect(result.data.recommendationLetterReceived).toBeNull();
    expect(result.data.numberOfJobsIntroduced).toBeNull();
    expect(result.data.responseSpeedDays).toBeNull();
    expect(result.data.overallRating).toBeNull();
  });

  it('新フィールドを全て null で明示しても受理', () => {
    const input = {
      ...baseRecord,
      specialtyIndustries: null,
      specialtyJobTypes: null,
      consultantQuality: null,
      hasExclusiveJobs: null,
      providesRecommendationLetter: null,
      recommendationLetterReceived: null,
      numberOfJobsIntroduced: null,
      responseSpeedDays: null,
      overallRating: null,
    };
    expect(AgentTrackRecordSchema.safeParse(input).success).toBe(true);
  });

  it('全新フィールドに有効値を設定した正常系', () => {
    const full = {
      ...baseRecord,
      specialtyIndustries: 'IT・通信、メーカー',
      specialtyJobTypes: 'エンジニア、プロダクトマネージャー',
      consultantQuality: 'excellent',
      hasExclusiveJobs: true,
      providesRecommendationLetter: true,
      recommendationLetterReceived: false,
      numberOfJobsIntroduced: 12,
      responseSpeedDays: 1.5,
      overallRating: 4,
    };
    expect(AgentTrackRecordSchema.safeParse(full).success).toBe(true);
  });

  // --- consultantQuality ---

  it.each(['excellent', 'good', 'fair', 'poor'])('consultantQuality: %s を受理', (v) => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, consultantQuality: v }).success).toBe(
      true,
    );
  });

  it('consultantQuality: 未知の値を拒否', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, consultantQuality: 'bad' }).success,
    ).toBe(false);
  });

  // --- numberOfJobsIntroduced ---

  it('numberOfJobsIntroduced: 0 を受理', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, numberOfJobsIntroduced: 0 }).success,
    ).toBe(true);
  });

  it('numberOfJobsIntroduced: 負数を拒否', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, numberOfJobsIntroduced: -1 }).success,
    ).toBe(false);
  });

  it('numberOfJobsIntroduced: 小数を拒否', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, numberOfJobsIntroduced: 1.5 }).success,
    ).toBe(false);
  });

  // --- responseSpeedDays ---

  it('responseSpeedDays: 0 を受理', () => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, responseSpeedDays: 0 }).success).toBe(
      true,
    );
  });

  it('responseSpeedDays: 小数を受理', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, responseSpeedDays: 0.5 }).success,
    ).toBe(true);
  });

  it('responseSpeedDays: 負数を拒否', () => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, responseSpeedDays: -1 }).success).toBe(
      false,
    );
  });

  // --- overallRating ---

  it('overallRating: 1〜5 を受理', () => {
    for (const v of [1, 2, 3, 4, 5]) {
      expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, overallRating: v }).success).toBe(
        true,
      );
    }
  });

  it('overallRating: 小数（例 4.5）を受理', () => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, overallRating: 4.5 }).success).toBe(
      true,
    );
  });

  it('overallRating: 0 を拒否（min: 1）', () => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, overallRating: 0 }).success).toBe(
      false,
    );
  });

  it('overallRating: 6 を拒否（max: 5）', () => {
    expect(AgentTrackRecordSchema.safeParse({ ...baseRecord, overallRating: 6 }).success).toBe(
      false,
    );
  });

  // --- boolean フィールド ---

  it('hasExclusiveJobs: true / false を受理', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, hasExclusiveJobs: true }).success,
    ).toBe(true);
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, hasExclusiveJobs: false }).success,
    ).toBe(true);
  });

  it('providesRecommendationLetter: true / false を受理', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, providesRecommendationLetter: true })
        .success,
    ).toBe(true);
  });

  it('recommendationLetterReceived: true / false を受理', () => {
    expect(
      AgentTrackRecordSchema.safeParse({ ...baseRecord, recommendationLetterReceived: false })
        .success,
    ).toBe(true);
  });
});

describe('AgentTrackRecordUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(AgentTrackRecordUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(
      AgentTrackRecordUpdateSchema.safeParse({ companyName: '新会社名', status: 'archived' })
        .success,
    ).toBe(true);
  });

  it('firstContactDate を null で更新できる', () => {
    expect(AgentTrackRecordUpdateSchema.safeParse({ firstContactDate: null }).success).toBe(true);
  });

  it('未知の status を拒否', () => {
    expect(AgentTrackRecordUpdateSchema.safeParse({ status: 'unknown' as 'active' }).success).toBe(
      false,
    );
  });

  it('companyName 空文字を拒否', () => {
    expect(AgentTrackRecordUpdateSchema.safeParse({ companyName: '' }).success).toBe(false);
  });

  it('新フィールドを patch で送れる', () => {
    expect(AgentTrackRecordUpdateSchema.safeParse({ consultantQuality: 'good' }).success).toBe(
      true,
    );
    expect(AgentTrackRecordUpdateSchema.safeParse({ hasExclusiveJobs: true }).success).toBe(true);
    expect(AgentTrackRecordUpdateSchema.safeParse({ overallRating: 4 }).success).toBe(true);
    expect(AgentTrackRecordUpdateSchema.safeParse({ numberOfJobsIntroduced: 5 }).success).toBe(
      true,
    );
  });

  it('新フィールドを null で patch できる', () => {
    expect(AgentTrackRecordUpdateSchema.safeParse({ consultantQuality: null }).success).toBe(true);
    expect(AgentTrackRecordUpdateSchema.safeParse({ overallRating: null }).success).toBe(true);
    expect(AgentTrackRecordUpdateSchema.safeParse({ specialtyIndustries: null }).success).toBe(
      true,
    );
  });

  it('consultantQuality: 未知の値を patch すると拒否', () => {
    expect(
      AgentTrackRecordUpdateSchema.safeParse({ consultantQuality: 'bad' as 'good' }).success,
    ).toBe(false);
  });

  it('overallRating: 範囲外を patch すると拒否', () => {
    expect(AgentTrackRecordUpdateSchema.safeParse({ overallRating: 0 }).success).toBe(false);
    expect(AgentTrackRecordUpdateSchema.safeParse({ overallRating: 6 }).success).toBe(false);
  });
});
