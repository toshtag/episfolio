import { describe, expect, it } from 'vitest';
import {
  RecruitmentBackgroundSchema,
  ResignationPlanSchema,
  ResignationPlanUpdateSchema,
} from '../../src/schemas/resignation-plan.js';

const basePlan = {
  id: '01RSGPLN1',
  jobTargetId: '01HJOB1',
  createdAt: '2026-05-04T00:00:00Z',
  updatedAt: '2026-05-04T00:00:00Z',
};

describe('RecruitmentBackgroundSchema', () => {
  it.each(['vacancy', 'expansion', 'unknown'])('%s を受理', (v) => {
    expect(RecruitmentBackgroundSchema.safeParse(v).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(RecruitmentBackgroundSchema.safeParse('new_grad').success).toBe(false);
  });
});

describe('ResignationPlanSchema', () => {
  it('正常系（最小構成）', () => {
    expect(ResignationPlanSchema.safeParse(basePlan).success).toBe(true);
  });

  it('省略した nullable フィールドは default null', () => {
    const result = ResignationPlanSchema.safeParse(basePlan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.annualSalary).toBeNull();
      expect(result.data.annualHolidays).toBeNull();
      expect(result.data.dailyWorkingHours).toBeNull();
      expect(result.data.commuteMinutes).toBeNull();
      expect(result.data.recruitmentBackground).toBeNull();
      expect(result.data.finalInterviewAt).toBeNull();
      expect(result.data.offerNotifiedAt).toBeNull();
      expect(result.data.offerAcceptedAt).toBeNull();
      expect(result.data.resignationNotifiedAt).toBeNull();
      expect(result.data.handoverStartedAt).toBeNull();
      expect(result.data.lastWorkingDayAt).toBeNull();
      expect(result.data.paidLeaveStartAt).toBeNull();
      expect(result.data.joinedAt).toBeNull();
      expect(result.data.availableDateFrom).toBeNull();
      expect(result.data.availableDateTo).toBeNull();
    }
  });

  it('省略した string フィールドは default 空文字', () => {
    const result = ResignationPlanSchema.safeParse(basePlan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.positionNote).toBe('');
      expect(result.data.riskMemo).toBe('');
      expect(result.data.negotiationNote).toBe('');
      expect(result.data.samuraiLossNote).toBe('');
      expect(result.data.samuraiGainNote).toBe('');
      expect(result.data.nextExitPlan).toBe('');
    }
  });

  it('全フィールドを明示指定して受理', () => {
    const input = {
      ...basePlan,
      annualSalary: 7000000,
      annualHolidays: 125,
      dailyWorkingHours: 8,
      commuteMinutes: 45,
      positionNote: 'シニアエンジニア',
      recruitmentBackground: 'expansion',
      riskMemo: '★★ 成長率に懸念',
      finalInterviewAt: '2026-04-20T10:00:00Z',
      offerNotifiedAt: '2026-04-25T15:00:00Z',
      offerAcceptedAt: '2026-04-28T10:00:00Z',
      resignationNotifiedAt: '2026-05-01T09:00:00Z',
      handoverStartedAt: '2026-05-15T09:00:00Z',
      lastWorkingDayAt: '2026-06-30T18:00:00Z',
      paidLeaveStartAt: '2026-07-01T00:00:00Z',
      joinedAt: '2026-08-01T09:00:00Z',
      availableDateFrom: '2026-07-01T00:00:00Z',
      availableDateTo: '2026-08-01T00:00:00Z',
      negotiationNote: '有給消化後に入社可能と伝えた',
      samuraiLossNote: '新卒同期との絆、無条件の信頼残高',
      samuraiGainNote: '担当領域の拡大、年収 +150 万',
      nextExitPlan: '3 年後にマネージャー or 次の転職',
    };
    expect(ResignationPlanSchema.safeParse(input).success).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(ResignationPlanSchema.safeParse({ ...basePlan, id: '' }).success).toBe(false);
  });

  it('jobTargetId 空文字を拒否', () => {
    expect(ResignationPlanSchema.safeParse({ ...basePlan, jobTargetId: '' }).success).toBe(false);
  });

  it('annualHolidays が 366 超を拒否', () => {
    expect(ResignationPlanSchema.safeParse({ ...basePlan, annualHolidays: 367 }).success).toBe(
      false,
    );
  });

  it('annualSalary が負数を拒否', () => {
    expect(ResignationPlanSchema.safeParse({ ...basePlan, annualSalary: -1 }).success).toBe(false);
  });

  it('dailyWorkingHours が 24 超を拒否', () => {
    expect(ResignationPlanSchema.safeParse({ ...basePlan, dailyWorkingHours: 25 }).success).toBe(
      false,
    );
  });

  it('日付フィールドに空文字を拒否', () => {
    expect(ResignationPlanSchema.safeParse({ ...basePlan, offerNotifiedAt: '' }).success).toBe(
      false,
    );
  });
});

describe('ResignationPlanUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(ResignationPlanUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(
      ResignationPlanUpdateSchema.safeParse({ negotiationNote: 'メモ更新', annualSalary: 6500000 })
        .success,
    ).toBe(true);
  });

  it('日付フィールドを null で更新できる', () => {
    expect(ResignationPlanUpdateSchema.safeParse({ offerNotifiedAt: null }).success).toBe(true);
  });

  it('recruitmentBackground を null で更新できる', () => {
    expect(ResignationPlanUpdateSchema.safeParse({ recruitmentBackground: null }).success).toBe(
      true,
    );
  });

  it('未知の recruitmentBackground を拒否', () => {
    expect(
      ResignationPlanUpdateSchema.safeParse({ recruitmentBackground: 'new_grad' as 'vacancy' })
        .success,
    ).toBe(false);
  });
});
