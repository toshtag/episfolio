import { describe, expect, it } from 'vitest';
import {
  CompanyCertificationCreateSchema,
  CompanyCertificationSchema,
  CompanyCertificationUpdateSchema,
} from '../../src/schemas/company-certification.js';

const base = {
  id: '01CC00001',
  jobTargetId: '01JT00001',
  hasKurumin: true,
  hasPlatinumKurumin: false,
  hasTomoni: true,
  eruboshiLevel: 3,
  hasPlatinumEruboshi: false,
  note: 'くるみん・トモニン取得済み。えるぼし認定レベル3。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('CompanyCertificationSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(CompanyCertificationSchema.safeParse(base).success).toBe(true);
  });

  it('nullable フィールドが null でも受理', () => {
    const input = { ...base, eruboshiLevel: null, note: null };
    expect(CompanyCertificationSchema.safeParse(input).success).toBe(true);
  });

  it('eruboshiLevel が 1 でも受理', () => {
    expect(CompanyCertificationSchema.safeParse({ ...base, eruboshiLevel: 1 }).success).toBe(true);
  });

  it('eruboshiLevel が 2 でも受理', () => {
    expect(CompanyCertificationSchema.safeParse({ ...base, eruboshiLevel: 2 }).success).toBe(true);
  });

  it('eruboshiLevel が 0 を拒否', () => {
    expect(CompanyCertificationSchema.safeParse({ ...base, eruboshiLevel: 0 }).success).toBe(false);
  });

  it('eruboshiLevel が 4 を拒否', () => {
    expect(CompanyCertificationSchema.safeParse({ ...base, eruboshiLevel: 4 }).success).toBe(false);
  });

  it('id が空文字を拒否', () => {
    expect(CompanyCertificationSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('jobTargetId が空文字を拒否', () => {
    expect(CompanyCertificationSchema.safeParse({ ...base, jobTargetId: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = base;
    expect(CompanyCertificationSchema.safeParse(withoutId).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = base;
    expect(CompanyCertificationSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });

  it('hasKurumin に非 boolean を拒否', () => {
    expect(CompanyCertificationSchema.safeParse({ ...base, hasKurumin: 'true' }).success).toBe(
      false,
    );
  });

  it('hasPlatinumEruboshi が true でも受理', () => {
    expect(
      CompanyCertificationSchema.safeParse({ ...base, hasPlatinumEruboshi: true }).success,
    ).toBe(true);
  });
});

describe('CompanyCertificationCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(CompanyCertificationCreateSchema.safeParse(input).success).toBe(true);
  });

  it('入力に createdAt を含めても strip される', () => {
    const result = CompanyCertificationCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('createdAt');
      expect(result.data).not.toHaveProperty('updatedAt');
    }
  });

  it('jobTargetId が必須', () => {
    const { createdAt: _c, updatedAt: _u, jobTargetId: _jt, ...withoutJobTarget } = base;
    expect(CompanyCertificationCreateSchema.safeParse(withoutJobTarget).success).toBe(false);
  });
});

describe('CompanyCertificationUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(CompanyCertificationUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('hasKurumin のみ更新できる', () => {
    expect(CompanyCertificationUpdateSchema.safeParse({ hasKurumin: false }).success).toBe(true);
  });

  it('eruboshiLevel を null に更新できる', () => {
    expect(CompanyCertificationUpdateSchema.safeParse({ eruboshiLevel: null }).success).toBe(true);
  });

  it('note を更新できる', () => {
    expect(CompanyCertificationUpdateSchema.safeParse({ note: '追加調査が必要' }).success).toBe(
      true,
    );
  });

  it('id を含めても strip される', () => {
    const result = CompanyCertificationUpdateSchema.safeParse({ id: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });

  it('jobTargetId を含めても strip される', () => {
    const result = CompanyCertificationUpdateSchema.safeParse({
      jobTargetId: 'should-be-stripped',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('jobTargetId');
    }
  });
});
