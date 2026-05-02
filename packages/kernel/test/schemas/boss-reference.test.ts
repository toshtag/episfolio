import { describe, expect, it } from 'vitest';
import {
  BossReferenceAxisValuesSchema,
  BossReferenceSchema,
  BossReferenceUpdateSchema,
} from '../../src/schemas/boss-reference.js';

const baseAxisValues = {
  logicVsEmotion: 2,
  resultVsProcess: 3,
  soloVsTeam: 4,
  futureVsTradition: 1,
  sharesPrivate: 5,
  teachingSkill: 2,
  listening: 3,
  busyness: 4,
};

const baseRef = {
  id: '01HBOSS1',
  bossName: '田中部長',
  companyName: '株式会社サンプル',
  period: '2020年4月〜2023年3月',
  axisValues: baseAxisValues,
  q1: '金融系のシステム開発',
  q2: '勤怠管理システムの刷新',
  q3: null,
  q4: null,
  q5: null,
  q6: null,
  q7: null,
  q8: null,
  q9: null,
  q10: null,
  q11: null,
  strengthEpisode: null,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('BossReferenceAxisValuesSchema', () => {
  it('正常系（全軸 1-5）', () => {
    expect(BossReferenceAxisValuesSchema.safeParse(baseAxisValues).success).toBe(true);
  });

  it('値が 1 を受理', () => {
    expect(BossReferenceAxisValuesSchema.safeParse({ ...baseAxisValues, logicVsEmotion: 1 }).success).toBe(true);
  });

  it('値が 5 を受理', () => {
    expect(BossReferenceAxisValuesSchema.safeParse({ ...baseAxisValues, logicVsEmotion: 5 }).success).toBe(true);
  });

  it('値が 0 を拒否', () => {
    expect(BossReferenceAxisValuesSchema.safeParse({ ...baseAxisValues, logicVsEmotion: 0 }).success).toBe(false);
  });

  it('値が 6 を拒否', () => {
    expect(BossReferenceAxisValuesSchema.safeParse({ ...baseAxisValues, logicVsEmotion: 6 }).success).toBe(false);
  });

  it('小数値を拒否', () => {
    expect(BossReferenceAxisValuesSchema.safeParse({ ...baseAxisValues, logicVsEmotion: 2.5 }).success).toBe(false);
  });

  it('軸フィールドが欠けていると拒否', () => {
    const { logicVsEmotion: _, ...missing } = baseAxisValues;
    expect(BossReferenceAxisValuesSchema.safeParse(missing).success).toBe(false);
  });
});

describe('BossReferenceSchema', () => {
  it('正常系（nullable フィールドあり）', () => {
    expect(BossReferenceSchema.safeParse(baseRef).success).toBe(true);
  });

  it('bossName が null でも受理', () => {
    expect(BossReferenceSchema.safeParse({ ...baseRef, bossName: null }).success).toBe(true);
  });

  it('全 q フィールドと strengthEpisode に値があっても受理', () => {
    const allFilled = {
      ...baseRef,
      q1: 'Q1回答', q2: 'Q2回答', q3: 'Q3回答', q4: 'Q4回答', q5: 'Q5回答',
      q6: 'Q6回答', q7: 'Q7回答', q8: 'Q8回答', q9: 'Q9回答', q10: 'Q10回答', q11: 'Q11回答',
      strengthEpisode: '強みエピソード本文',
    };
    expect(BossReferenceSchema.safeParse(allFilled).success).toBe(true);
  });

  it('companyName 空文字を拒否', () => {
    expect(BossReferenceSchema.safeParse({ ...baseRef, companyName: '' }).success).toBe(false);
  });

  it('period 空文字を拒否', () => {
    expect(BossReferenceSchema.safeParse({ ...baseRef, period: '' }).success).toBe(false);
  });

  it('axisValues の範囲外を拒否', () => {
    expect(BossReferenceSchema.safeParse({
      ...baseRef,
      axisValues: { ...baseAxisValues, busyness: 6 },
    }).success).toBe(false);
  });
});

describe('BossReferenceUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(BossReferenceUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('companyName のみ更新できる', () => {
    expect(BossReferenceUpdateSchema.safeParse({ companyName: '新会社名' }).success).toBe(true);
  });

  it('q1 のみ更新できる', () => {
    expect(BossReferenceUpdateSchema.safeParse({ q1: '更新後の回答' }).success).toBe(true);
  });

  it('q フィールドを null で更新できる', () => {
    expect(BossReferenceUpdateSchema.safeParse({ q3: null }).success).toBe(true);
  });

  it('axisValues を部分更新できる（全軸指定）', () => {
    expect(BossReferenceUpdateSchema.safeParse({ axisValues: baseAxisValues }).success).toBe(true);
  });

  it('companyName 空文字を拒否', () => {
    expect(BossReferenceUpdateSchema.safeParse({ companyName: '' }).success).toBe(false);
  });
});
