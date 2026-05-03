import { describe, expect, it } from 'vitest';
import {
  RecruitmentImpressionCreateSchema,
  RecruitmentImpressionSchema,
  RecruitmentImpressionUpdateSchema,
  SensoryObservationSchema,
} from '../../src/schemas/recruitment-impression.js';

const base = {
  id: '01RI00001',
  jobTargetId: '01JT00001',
  selectionProcessNote: '書類選考→一次面接（人事）→二次面接（現場）→最終（役員）の4段階。平均選考期間は3週間とのこと。',
  officeAtmosphere: '受付の対応が丁寧。待合室はガラス張りで開放的。スーツ着用者が多め。',
  sensoryObservations: [
    { category: '視覚', note: 'オープンフロアでパーティションが低い。グリーンが多く配置されている。' },
    { category: '聴覚', note: '会話の声が適度に聞こえ、静かすぎない。BGMはなし。' },
  ],
  lifestyleCompatibilityNote: '残業平均20時間/月、在宅週2回可。子育て世代が多いとのこと。',
  redFlagsNote: null,
  overallImpression: '面接官の言葉遣いが丁寧で、入社後のキャリアパスについて具体的に話してくれた。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('SensoryObservationSchema', () => {
  it('正常系', () => {
    expect(
      SensoryObservationSchema.safeParse({ category: '視覚', note: 'オープンフロア' }).success,
    ).toBe(true);
  });

  it('category が空文字でも受理', () => {
    expect(SensoryObservationSchema.safeParse({ category: '', note: '' }).success).toBe(true);
  });

  it('category 欠如を拒否', () => {
    expect(SensoryObservationSchema.safeParse({ note: 'メモ' }).success).toBe(false);
  });

  it('note 欠如を拒否', () => {
    expect(SensoryObservationSchema.safeParse({ category: '視覚' }).success).toBe(false);
  });
});

describe('RecruitmentImpressionSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(RecruitmentImpressionSchema.safeParse(base).success).toBe(true);
  });

  it('nullable フィールドが null でも受理', () => {
    const input = {
      ...base,
      selectionProcessNote: null,
      officeAtmosphere: null,
      lifestyleCompatibilityNote: null,
      redFlagsNote: null,
      overallImpression: null,
    };
    expect(RecruitmentImpressionSchema.safeParse(input).success).toBe(true);
  });

  it('sensoryObservations が空配列でも受理', () => {
    expect(
      RecruitmentImpressionSchema.safeParse({ ...base, sensoryObservations: [] }).success,
    ).toBe(true);
  });

  it('sensoryObservations に複数エントリを受理', () => {
    const input = {
      ...base,
      sensoryObservations: [
        { category: '視覚', note: '明るい' },
        { category: '聴覚', note: '静か' },
        { category: '嗅覚', note: 'コーヒーの香り' },
      ],
    };
    expect(RecruitmentImpressionSchema.safeParse(input).success).toBe(true);
  });

  it('id が空文字を拒否', () => {
    expect(RecruitmentImpressionSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('jobTargetId が空文字を拒否', () => {
    expect(RecruitmentImpressionSchema.safeParse({ ...base, jobTargetId: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = base;
    expect(RecruitmentImpressionSchema.safeParse(withoutId).success).toBe(false);
  });

  it('jobTargetId 欠如を拒否', () => {
    const { jobTargetId: _omit, ...withoutJobTargetId } = base;
    expect(RecruitmentImpressionSchema.safeParse(withoutJobTargetId).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = base;
    expect(RecruitmentImpressionSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });
});

describe('RecruitmentImpressionCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(RecruitmentImpressionCreateSchema.safeParse(input).success).toBe(true);
  });

  it('入力に createdAt を含めても strip される', () => {
    const result = RecruitmentImpressionCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('createdAt');
      expect(result.data).not.toHaveProperty('updatedAt');
    }
  });

  it('jobTargetId が必須', () => {
    const { createdAt: _c, updatedAt: _u, jobTargetId: _jt, ...withoutJobTarget } = base;
    expect(RecruitmentImpressionCreateSchema.safeParse(withoutJobTarget).success).toBe(false);
  });
});

describe('RecruitmentImpressionUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(RecruitmentImpressionUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('selectionProcessNote のみ更新できる', () => {
    expect(
      RecruitmentImpressionUpdateSchema.safeParse({ selectionProcessNote: '3段階選考に変更' }).success,
    ).toBe(true);
  });

  it('redFlagsNote を null に更新できる', () => {
    expect(RecruitmentImpressionUpdateSchema.safeParse({ redFlagsNote: null }).success).toBe(true);
  });

  it('sensoryObservations を空配列に更新できる', () => {
    expect(
      RecruitmentImpressionUpdateSchema.safeParse({ sensoryObservations: [] }).success,
    ).toBe(true);
  });

  it('id を含めても strip される', () => {
    const result = RecruitmentImpressionUpdateSchema.safeParse({ id: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });

  it('jobTargetId を含めても strip される', () => {
    const result = RecruitmentImpressionUpdateSchema.safeParse({ jobTargetId: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('jobTargetId');
    }
  });
});
