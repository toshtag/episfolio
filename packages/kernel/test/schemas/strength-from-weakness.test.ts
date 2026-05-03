import { describe, expect, it } from 'vitest';
import {
  BlankTypeSchema,
  StrengthFromWeaknessCreateSchema,
  StrengthFromWeaknessSchema,
  StrengthFromWeaknessUpdateSchema,
} from '../../src/schemas/strength-from-weakness.js';

const base = {
  id: '01SFW0001',
  weaknessLabel: '1年での早期退職',
  blankType: 'early_resign' as const,
  background: '営業が辛くて1年で退職した',
  reframe: '現場の本音を理解できる採用担当者になれる',
  targetCompanyProfile: '社員の弱みを受け入れる文化がある会社',
  note: 'メンバープロフィールで確認済み',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('BlankTypeSchema', () => {
  it('leave / unemployed / early_resign / other を受理', () => {
    expect(BlankTypeSchema.safeParse('leave').success).toBe(true);
    expect(BlankTypeSchema.safeParse('unemployed').success).toBe(true);
    expect(BlankTypeSchema.safeParse('early_resign').success).toBe(true);
    expect(BlankTypeSchema.safeParse('other').success).toBe(true);
  });

  it('不正な値を拒否', () => {
    expect(BlankTypeSchema.safeParse('unknown').success).toBe(false);
    expect(BlankTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('StrengthFromWeaknessSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(StrengthFromWeaknessSchema.safeParse(base).success).toBe(true);
  });

  it('blankType が null でも受理', () => {
    expect(StrengthFromWeaknessSchema.safeParse({ ...base, blankType: null }).success).toBe(true);
  });

  it('note が null でも受理', () => {
    expect(StrengthFromWeaknessSchema.safeParse({ ...base, note: null }).success).toBe(true);
  });

  it('weaknessLabel が空文字でも受理', () => {
    expect(StrengthFromWeaknessSchema.safeParse({ ...base, weaknessLabel: '' }).success).toBe(true);
  });

  it('background が空文字でも受理', () => {
    expect(StrengthFromWeaknessSchema.safeParse({ ...base, background: '' }).success).toBe(true);
  });

  it('reframe が空文字でも受理', () => {
    expect(StrengthFromWeaknessSchema.safeParse({ ...base, reframe: '' }).success).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(StrengthFromWeaknessSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = base;
    expect(StrengthFromWeaknessSchema.safeParse(withoutId).success).toBe(false);
  });

  it('不正な blankType を拒否', () => {
    expect(StrengthFromWeaknessSchema.safeParse({ ...base, blankType: 'invalid' }).success).toBe(
      false,
    );
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = base;
    expect(StrengthFromWeaknessSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });
});

describe('StrengthFromWeaknessCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(StrengthFromWeaknessCreateSchema.safeParse(input).success).toBe(true);
  });

  it('blankType が null でも create を受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(StrengthFromWeaknessCreateSchema.safeParse({ ...input, blankType: null }).success).toBe(
      true,
    );
  });

  it('入力に createdAt を含めても strip される', () => {
    const result = StrengthFromWeaknessCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('createdAt');
      expect(result.data).not.toHaveProperty('updatedAt');
    }
  });
});

describe('StrengthFromWeaknessUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(StrengthFromWeaknessUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('weaknessLabel のみ更新できる', () => {
    expect(
      StrengthFromWeaknessUpdateSchema.safeParse({ weaknessLabel: '新しい弱み' }).success,
    ).toBe(true);
  });

  it('blankType を null に更新できる', () => {
    expect(StrengthFromWeaknessUpdateSchema.safeParse({ blankType: null }).success).toBe(true);
  });

  it('note を null に更新できる', () => {
    expect(StrengthFromWeaknessUpdateSchema.safeParse({ note: null }).success).toBe(true);
  });

  it('不正な blankType は拒否', () => {
    expect(StrengthFromWeaknessUpdateSchema.safeParse({ blankType: 'invalid' }).success).toBe(
      false,
    );
  });

  it('id を含めても strip される', () => {
    const result = StrengthFromWeaknessUpdateSchema.safeParse({ id: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });
});
