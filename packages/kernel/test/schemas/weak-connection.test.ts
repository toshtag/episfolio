import { describe, expect, it } from 'vitest';
import {
  ContactStatusSchema,
  WeakConnectionCategorySchema,
  WeakConnectionCreateSchema,
  WeakConnectionSchema,
  WeakConnectionUpdateSchema,
} from '../../src/schemas/weak-connection.js';

const base = {
  id: '01WC00001',
  name: '田中太郎',
  category: 'student_days',
  relation: '大学のゼミ仲間',
  contactStatus: 'not_contacted',
  prospectNote: 'IT 系の会社に勤めているので転職先の紹介を頼めるかも',
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('WeakConnectionCategorySchema', () => {
  it.each([
    'student_days',
    'family_network',
    'business_card',
    'hobby',
    'sns',
  ] as const)('%s を受理', (cat) => {
    expect(WeakConnectionCategorySchema.safeParse(cat).success).toBe(true);
  });

  it('不正な値を拒否', () => {
    expect(WeakConnectionCategorySchema.safeParse('unknown').success).toBe(false);
  });
});

describe('ContactStatusSchema', () => {
  it.each(['not_contacted', 'contacted', 'replied'] as const)('%s を受理', (status) => {
    expect(ContactStatusSchema.safeParse(status).success).toBe(true);
  });

  it('不正な値を拒否', () => {
    expect(ContactStatusSchema.safeParse('pending').success).toBe(false);
  });
});

describe('WeakConnectionSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(WeakConnectionSchema.safeParse(base).success).toBe(true);
  });

  it('note が null でも受理', () => {
    expect(WeakConnectionSchema.safeParse({ ...base, note: null }).success).toBe(true);
  });

  it('note が文字列でも受理', () => {
    expect(WeakConnectionSchema.safeParse({ ...base, note: 'メモ' }).success).toBe(true);
  });

  it('name が空文字でも受理', () => {
    expect(WeakConnectionSchema.safeParse({ ...base, name: '' }).success).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(WeakConnectionSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = base;
    expect(WeakConnectionSchema.safeParse(withoutId).success).toBe(false);
  });

  it('category が不正な値を拒否', () => {
    expect(WeakConnectionSchema.safeParse({ ...base, category: 'unknown' }).success).toBe(false);
  });

  it('contactStatus が不正な値を拒否', () => {
    expect(WeakConnectionSchema.safeParse({ ...base, contactStatus: 'pending' }).success).toBe(
      false,
    );
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = base;
    expect(WeakConnectionSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });
});

describe('WeakConnectionCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(WeakConnectionCreateSchema.safeParse(input).success).toBe(true);
  });

  it('入力に createdAt を含めても strip される', () => {
    const result = WeakConnectionCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('createdAt');
      expect(result.data).not.toHaveProperty('updatedAt');
    }
  });
});

describe('WeakConnectionUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(WeakConnectionUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('name のみ更新できる', () => {
    expect(WeakConnectionUpdateSchema.safeParse({ name: '新名前' }).success).toBe(true);
  });

  it('contactStatus のみ更新できる', () => {
    expect(WeakConnectionUpdateSchema.safeParse({ contactStatus: 'replied' }).success).toBe(true);
  });

  it('note を null に更新できる', () => {
    expect(WeakConnectionUpdateSchema.safeParse({ note: null }).success).toBe(true);
  });

  it('id を含めても strip される', () => {
    const result = WeakConnectionUpdateSchema.safeParse({ id: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });
});
