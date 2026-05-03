import { describe, expect, it } from 'vitest';
import {
  BusinessUnitTypeMatchCreateSchema,
  BusinessUnitTypeMatchSchema,
  BusinessUnitTypeMatchUpdateSchema,
  BusinessUnitTypeSchema,
} from '../../src/schemas/business-unit-type-match.js';

const base = {
  id: '01BU00001',
  jobTargetId: '01JT00001',
  companyUnitType: 'star',
  selfType: 'challenge',
  isMatchConfirmed: false,
  matchNote: '企業は花形だが自己はチャレンジ型。要検討。',
  motivationDraft: '向上心を持ちつつ企業の成長に貢献したい。',
  note: '面談で確認予定。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('BusinessUnitTypeSchema', () => {
  it('有効な値を受理', () => {
    for (const v of ['star', 'support', 'challenge', 'turnaround']) {
      expect(BusinessUnitTypeSchema.safeParse(v).success).toBe(true);
    }
  });

  it('無効な値を拒否', () => {
    expect(BusinessUnitTypeSchema.safeParse('unknown').success).toBe(false);
    expect(BusinessUnitTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('BusinessUnitTypeMatchSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(BusinessUnitTypeMatchSchema.safeParse(base).success).toBe(true);
  });

  it('nullable フィールドが null でも受理', () => {
    const input = {
      ...base,
      companyUnitType: null,
      selfType: null,
      matchNote: null,
      motivationDraft: null,
      note: null,
    };
    expect(BusinessUnitTypeMatchSchema.safeParse(input).success).toBe(true);
  });

  it('companyUnitType が support でも受理', () => {
    expect(
      BusinessUnitTypeMatchSchema.safeParse({ ...base, companyUnitType: 'support' }).success,
    ).toBe(true);
  });

  it('selfType が turnaround でも受理', () => {
    expect(BusinessUnitTypeMatchSchema.safeParse({ ...base, selfType: 'turnaround' }).success).toBe(
      true,
    );
  });

  it('isMatchConfirmed が true でも受理', () => {
    expect(
      BusinessUnitTypeMatchSchema.safeParse({ ...base, isMatchConfirmed: true }).success,
    ).toBe(true);
  });

  it('companyUnitType に無効な値を拒否', () => {
    expect(
      BusinessUnitTypeMatchSchema.safeParse({ ...base, companyUnitType: 'invalid' }).success,
    ).toBe(false);
  });

  it('id が空文字を拒否', () => {
    expect(BusinessUnitTypeMatchSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('jobTargetId が空文字を拒否', () => {
    expect(BusinessUnitTypeMatchSchema.safeParse({ ...base, jobTargetId: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = base;
    expect(BusinessUnitTypeMatchSchema.safeParse(withoutId).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = base;
    expect(BusinessUnitTypeMatchSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });

  it('isMatchConfirmed に非 boolean を拒否', () => {
    expect(
      BusinessUnitTypeMatchSchema.safeParse({ ...base, isMatchConfirmed: 'true' }).success,
    ).toBe(false);
  });
});

describe('BusinessUnitTypeMatchCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(BusinessUnitTypeMatchCreateSchema.safeParse(input).success).toBe(true);
  });

  it('入力に createdAt を含めても strip される', () => {
    const result = BusinessUnitTypeMatchCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('createdAt');
      expect(result.data).not.toHaveProperty('updatedAt');
    }
  });

  it('jobTargetId が必須', () => {
    const { createdAt: _c, updatedAt: _u, jobTargetId: _jt, ...withoutJobTarget } = base;
    expect(BusinessUnitTypeMatchCreateSchema.safeParse(withoutJobTarget).success).toBe(false);
  });
});

describe('BusinessUnitTypeMatchUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(BusinessUnitTypeMatchUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('companyUnitType のみ更新できる', () => {
    expect(
      BusinessUnitTypeMatchUpdateSchema.safeParse({ companyUnitType: 'support' }).success,
    ).toBe(true);
  });

  it('isMatchConfirmed を true に更新できる', () => {
    expect(
      BusinessUnitTypeMatchUpdateSchema.safeParse({ isMatchConfirmed: true }).success,
    ).toBe(true);
  });

  it('companyUnitType を null に更新できる', () => {
    expect(
      BusinessUnitTypeMatchUpdateSchema.safeParse({ companyUnitType: null }).success,
    ).toBe(true);
  });

  it('note を更新できる', () => {
    expect(BusinessUnitTypeMatchUpdateSchema.safeParse({ note: '更新後メモ' }).success).toBe(true);
  });

  it('id を含めても strip される', () => {
    const result = BusinessUnitTypeMatchUpdateSchema.safeParse({ id: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });

  it('jobTargetId を含めても strip される', () => {
    const result = BusinessUnitTypeMatchUpdateSchema.safeParse({
      jobTargetId: 'should-be-stripped',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('jobTargetId');
    }
  });
});
