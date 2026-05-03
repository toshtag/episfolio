import { describe, expect, it } from 'vitest';
import {
  ResultByTypeCreateSchema,
  ResultByTypeSchema,
  ResultByTypeUpdateSchema,
  ResultEntrySchema,
  ResultTypeSchema,
  SkillTypeSchema,
} from '../../src/schemas/result-by-type.js';

const baseEntry = {
  id: '01ENTRY001',
  resultType: 'revenue' as const,
  situation: '新規顧客開拓に行き詰まっていた',
  action: 'マーケティング担当と連携し提案資料を改善した',
  result: '定価納品が増えた',
  quantification: null,
  skillType: 'outcome' as const,
  note: null,
};

const baseResult = {
  id: '01RESULT001',
  title: '営業での実績',
  entries: [baseEntry],
  memo: '',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('ResultTypeSchema', () => {
  it('revenue / cost / both を受理', () => {
    expect(ResultTypeSchema.safeParse('revenue').success).toBe(true);
    expect(ResultTypeSchema.safeParse('cost').success).toBe(true);
    expect(ResultTypeSchema.safeParse('both').success).toBe(true);
  });

  it('不正な type を拒否', () => {
    expect(ResultTypeSchema.safeParse('profit').success).toBe(false);
    expect(ResultTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('SkillTypeSchema', () => {
  it('outcome / cause を受理', () => {
    expect(SkillTypeSchema.safeParse('outcome').success).toBe(true);
    expect(SkillTypeSchema.safeParse('cause').success).toBe(true);
  });

  it('不正な skillType を拒否', () => {
    expect(SkillTypeSchema.safeParse('result').success).toBe(false);
    expect(SkillTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('ResultEntrySchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(ResultEntrySchema.safeParse(baseEntry).success).toBe(true);
  });

  it('quantification が null でも受理', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, quantification: null }).success).toBe(true);
  });

  it('quantification に文字列を受理', () => {
    expect(
      ResultEntrySchema.safeParse({ ...baseEntry, quantification: '受注率 20% 向上' }).success,
    ).toBe(true);
  });

  it('quantification が空文字は拒否', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, quantification: '' }).success).toBe(false);
  });

  it('note が null でも受理', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, note: null }).success).toBe(true);
  });

  it('note に文字列を受理', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, note: '補足メモ' }).success).toBe(true);
  });

  it('note が空文字は拒否', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, note: '' }).success).toBe(false);
  });

  it('situation が空文字でも受理', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, situation: '' }).success).toBe(true);
  });

  it('action が空文字でも受理', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, action: '' }).success).toBe(true);
  });

  it('result が空文字でも受理', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, result: '' }).success).toBe(true);
  });

  it('cost タイプを受理', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, resultType: 'cost' }).success).toBe(true);
  });

  it('both タイプを受理', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, resultType: 'both' }).success).toBe(true);
  });

  it('cause skillType を受理', () => {
    expect(ResultEntrySchema.safeParse({ ...baseEntry, skillType: 'cause' }).success).toBe(true);
  });
});

describe('ResultByTypeSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(ResultByTypeSchema.safeParse(baseResult).success).toBe(true);
  });

  it('entries が空配列でも受理', () => {
    expect(ResultByTypeSchema.safeParse({ ...baseResult, entries: [] }).success).toBe(true);
  });

  it('memo が空文字でも受理', () => {
    expect(ResultByTypeSchema.safeParse({ ...baseResult, memo: '' }).success).toBe(true);
  });

  it('id が空文字は拒否', () => {
    expect(ResultByTypeSchema.safeParse({ ...baseResult, id: '' }).success).toBe(false);
  });

  it('createdAt が空文字は拒否', () => {
    expect(ResultByTypeSchema.safeParse({ ...baseResult, createdAt: '' }).success).toBe(false);
  });
});

describe('ResultByTypeCreateSchema', () => {
  it('createdAt / updatedAt なしで受理', () => {
    const { createdAt: _c, updatedAt: _u, ...create } = baseResult;
    expect(ResultByTypeCreateSchema.safeParse(create).success).toBe(true);
  });

  it('createdAt があっても strip されて受理される', () => {
    const parsed = ResultByTypeCreateSchema.safeParse(baseResult);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect('createdAt' in parsed.data).toBe(false);
    }
  });
});

describe('ResultByTypeUpdateSchema', () => {
  it('全フィールドなし（空オブジェクト）でも受理', () => {
    expect(ResultByTypeUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('title のみの patch を受理', () => {
    expect(ResultByTypeUpdateSchema.safeParse({ title: '新タイトル' }).success).toBe(true);
  });

  it('entries のみの patch を受理', () => {
    expect(ResultByTypeUpdateSchema.safeParse({ entries: [] }).success).toBe(true);
  });

  it('memo のみの patch を受理', () => {
    expect(ResultByTypeUpdateSchema.safeParse({ memo: '補足' }).success).toBe(true);
  });

  it('id を含む patch は strip されて受理される', () => {
    const parsed = ResultByTypeUpdateSchema.safeParse({ id: '01RESULT001' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect('id' in parsed.data).toBe(false);
    }
  });
});
