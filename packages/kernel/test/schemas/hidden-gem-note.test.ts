import { describe, expect, it } from 'vitest';
import {
  HiddenGemNoteCreateSchema,
  HiddenGemNoteSchema,
  HiddenGemNoteUpdateSchema,
} from '../../src/schemas/hidden-gem-note.js';

const base = {
  id: '01HG00001',
  jobTargetId: '01JT00001',
  isGntListed: true,
  nicheKeywords: 'ニッチトップ シェアNO.1 独自技術',
  hasAntiMonsterMechanism: true,
  mechanismNote: '他社に提供できない独自商品→余裕ある経営→社員を大切にする好循環',
  isHiringOnJobSites: false,
  directContactNote: '採用ページから直接応募。人事担当に連絡済み。',
  note: '経産省GNT100選掲載。モンスター化しにくい好循環が確認できた。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('HiddenGemNoteSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(HiddenGemNoteSchema.safeParse(base).success).toBe(true);
  });

  it('nullable フィールドが null でも受理', () => {
    const input = {
      ...base,
      nicheKeywords: null,
      mechanismNote: null,
      directContactNote: null,
      note: null,
    };
    expect(HiddenGemNoteSchema.safeParse(input).success).toBe(true);
  });

  it('isGntListed が false でも受理', () => {
    expect(HiddenGemNoteSchema.safeParse({ ...base, isGntListed: false }).success).toBe(true);
  });

  it('hasAntiMonsterMechanism が false でも受理', () => {
    expect(HiddenGemNoteSchema.safeParse({ ...base, hasAntiMonsterMechanism: false }).success).toBe(
      true,
    );
  });

  it('isHiringOnJobSites が true でも受理', () => {
    expect(HiddenGemNoteSchema.safeParse({ ...base, isHiringOnJobSites: true }).success).toBe(true);
  });

  it('id が空文字を拒否', () => {
    expect(HiddenGemNoteSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('jobTargetId が空文字を拒否', () => {
    expect(HiddenGemNoteSchema.safeParse({ ...base, jobTargetId: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = base;
    expect(HiddenGemNoteSchema.safeParse(withoutId).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = base;
    expect(HiddenGemNoteSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });

  it('isGntListed に非 boolean を拒否', () => {
    expect(HiddenGemNoteSchema.safeParse({ ...base, isGntListed: 'true' }).success).toBe(false);
  });
});

describe('HiddenGemNoteCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(HiddenGemNoteCreateSchema.safeParse(input).success).toBe(true);
  });

  it('入力に createdAt を含めても strip される', () => {
    const result = HiddenGemNoteCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('createdAt');
      expect(result.data).not.toHaveProperty('updatedAt');
    }
  });

  it('jobTargetId が必須', () => {
    const { createdAt: _c, updatedAt: _u, jobTargetId: _jt, ...withoutJobTarget } = base;
    expect(HiddenGemNoteCreateSchema.safeParse(withoutJobTarget).success).toBe(false);
  });
});

describe('HiddenGemNoteUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(HiddenGemNoteUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('isGntListed のみ更新できる', () => {
    expect(HiddenGemNoteUpdateSchema.safeParse({ isGntListed: false }).success).toBe(true);
  });

  it('nicheKeywords を null に更新できる', () => {
    expect(HiddenGemNoteUpdateSchema.safeParse({ nicheKeywords: null }).success).toBe(true);
  });

  it('note を更新できる', () => {
    expect(HiddenGemNoteUpdateSchema.safeParse({ note: '追加調査が必要' }).success).toBe(true);
  });

  it('id を含めても strip される', () => {
    const result = HiddenGemNoteUpdateSchema.safeParse({ id: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });

  it('jobTargetId を含めても strip される', () => {
    const result = HiddenGemNoteUpdateSchema.safeParse({ jobTargetId: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('jobTargetId');
    }
  });
});
