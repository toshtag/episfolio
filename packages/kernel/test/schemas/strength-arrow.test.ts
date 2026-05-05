import { describe, expect, it } from 'vitest';
import {
  StrengthArrowCreateSchema,
  StrengthArrowSchema,
  StrengthArrowTypeSchema,
  StrengthArrowUpdateSchema,
} from '../../src/schemas/strength-arrow.js';

const baseArrow = {
  id: '01ARROW001',
  type: 'interest' as const,
  description: 'なぜそんなに詳しいんですか？と聞かれた',
  source: '営業部の先輩',
  occurredAt: '2024-03-01',
  note: '自分では当たり前だと思っていた',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('StrengthArrowTypeSchema', () => {
  it('interest / evaluation / request を受理', () => {
    expect(StrengthArrowTypeSchema.safeParse('interest').success).toBe(true);
    expect(StrengthArrowTypeSchema.safeParse('evaluation').success).toBe(true);
    expect(StrengthArrowTypeSchema.safeParse('request').success).toBe(true);
  });

  it('不正な type を拒否', () => {
    expect(StrengthArrowTypeSchema.safeParse('unknown').success).toBe(false);
    expect(StrengthArrowTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('StrengthArrowSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(StrengthArrowSchema.safeParse(baseArrow).success).toBe(true);
  });

  it('occurredAt が null でも受理', () => {
    expect(StrengthArrowSchema.safeParse({ ...baseArrow, occurredAt: null }).success).toBe(true);
  });

  it('note が null でも受理', () => {
    expect(StrengthArrowSchema.safeParse({ ...baseArrow, note: null }).success).toBe(true);
  });

  it('description が空文字でも受理', () => {
    expect(StrengthArrowSchema.safeParse({ ...baseArrow, description: '' }).success).toBe(true);
  });

  it('source が空文字でも受理', () => {
    expect(StrengthArrowSchema.safeParse({ ...baseArrow, source: '' }).success).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(StrengthArrowSchema.safeParse({ ...baseArrow, id: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = baseArrow;
    expect(StrengthArrowSchema.safeParse(withoutId).success).toBe(false);
  });

  it('type 欠如を拒否', () => {
    const { type: _omit, ...withoutType } = baseArrow;
    expect(StrengthArrowSchema.safeParse(withoutType).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = baseArrow;
    expect(StrengthArrowSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });

  it('occurredAt が空文字（非 null）を拒否', () => {
    expect(StrengthArrowSchema.safeParse({ ...baseArrow, occurredAt: '' }).success).toBe(false);
  });
});

describe('StrengthArrowCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = baseArrow;
    expect(StrengthArrowCreateSchema.safeParse(input).success).toBe(true);
  });

  it('occurredAt が null でも create を受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = baseArrow;
    expect(StrengthArrowCreateSchema.safeParse({ ...input, occurredAt: null }).success).toBe(true);
  });
});

describe('StrengthArrowUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(StrengthArrowUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('type のみ更新できる', () => {
    expect(StrengthArrowUpdateSchema.safeParse({ type: 'evaluation' }).success).toBe(true);
  });

  it('description のみ更新できる', () => {
    expect(StrengthArrowUpdateSchema.safeParse({ description: '更新後' }).success).toBe(true);
  });

  it('occurredAt を null に更新できる', () => {
    expect(StrengthArrowUpdateSchema.safeParse({ occurredAt: null }).success).toBe(true);
  });

  it('note を null に更新できる', () => {
    expect(StrengthArrowUpdateSchema.safeParse({ note: null }).success).toBe(true);
  });

  it('id を含めても無視される', () => {
    const result = StrengthArrowUpdateSchema.safeParse({ id: 'should-be-ignored' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });

  it('不正な type は拒否', () => {
    expect(StrengthArrowUpdateSchema.safeParse({ type: 'unknown' }).success).toBe(false);
  });
});
