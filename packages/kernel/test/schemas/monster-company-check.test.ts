import { describe, expect, it } from 'vitest';
import {
  MonsterCompanyCheckCreateSchema,
  MonsterCompanyCheckSchema,
  MonsterCompanyCheckUpdateSchema,
  ResignationEntrySchema,
} from '../../src/schemas/monster-company-check.js';

const base = {
  id: '01MCC0001',
  jobTargetId: '01JT00001',
  mhlwCaseUrl: 'https://example.com/case',
  violationLaw: '労働基準法第32条',
  caseSummary: '時間外労働が月100時間を超える違反',
  casePublicationDate: '2024-03-15',
  resignationEntries: [{ url: 'https://example.com/quit', summary: '残業が多くて退職' }],
  hiddenMonsterNote: '開発部署のみ深夜残業常態化との口コミあり',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('ResignationEntrySchema', () => {
  it('正常系', () => {
    expect(
      ResignationEntrySchema.safeParse({ url: 'https://example.com', summary: '要約' }).success,
    ).toBe(true);
  });

  it('url が空文字でも受理', () => {
    expect(ResignationEntrySchema.safeParse({ url: '', summary: '' }).success).toBe(true);
  });

  it('url 欠如を拒否', () => {
    expect(ResignationEntrySchema.safeParse({ summary: '要約' }).success).toBe(false);
  });
});

describe('MonsterCompanyCheckSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(MonsterCompanyCheckSchema.safeParse(base).success).toBe(true);
  });

  it('nullable フィールドが null でも受理', () => {
    const input = {
      ...base,
      mhlwCaseUrl: null,
      violationLaw: null,
      caseSummary: null,
      casePublicationDate: null,
      hiddenMonsterNote: null,
    };
    expect(MonsterCompanyCheckSchema.safeParse(input).success).toBe(true);
  });

  it('resignationEntries が空配列でも受理', () => {
    expect(MonsterCompanyCheckSchema.safeParse({ ...base, resignationEntries: [] }).success).toBe(
      true,
    );
  });

  it('resignationEntries に複数エントリを受理', () => {
    const input = {
      ...base,
      resignationEntries: [
        { url: 'https://a.com', summary: '要約A' },
        { url: 'https://b.com', summary: '要約B' },
      ],
    };
    expect(MonsterCompanyCheckSchema.safeParse(input).success).toBe(true);
  });

  it('id が空文字を拒否', () => {
    expect(MonsterCompanyCheckSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('jobTargetId が空文字を拒否', () => {
    expect(MonsterCompanyCheckSchema.safeParse({ ...base, jobTargetId: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = base;
    expect(MonsterCompanyCheckSchema.safeParse(withoutId).success).toBe(false);
  });

  it('jobTargetId 欠如を拒否', () => {
    const { jobTargetId: _omit, ...withoutJobTargetId } = base;
    expect(MonsterCompanyCheckSchema.safeParse(withoutJobTargetId).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = base;
    expect(MonsterCompanyCheckSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });
});

describe('MonsterCompanyCheckCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(MonsterCompanyCheckCreateSchema.safeParse(input).success).toBe(true);
  });

  it('入力に createdAt を含めても strip される', () => {
    const result = MonsterCompanyCheckCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('createdAt');
      expect(result.data).not.toHaveProperty('updatedAt');
    }
  });

  it('jobTargetId が必須', () => {
    const { createdAt: _c, updatedAt: _u, jobTargetId: _jt, ...withoutJobTarget } = base;
    expect(MonsterCompanyCheckCreateSchema.safeParse(withoutJobTarget).success).toBe(false);
  });
});

describe('MonsterCompanyCheckUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(MonsterCompanyCheckUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('violationLaw のみ更新できる', () => {
    expect(
      MonsterCompanyCheckUpdateSchema.safeParse({ violationLaw: '労働安全衛生法第65条' }).success,
    ).toBe(true);
  });

  it('hiddenMonsterNote を null に更新できる', () => {
    expect(MonsterCompanyCheckUpdateSchema.safeParse({ hiddenMonsterNote: null }).success).toBe(
      true,
    );
  });

  it('resignationEntries を空配列に更新できる', () => {
    expect(MonsterCompanyCheckUpdateSchema.safeParse({ resignationEntries: [] }).success).toBe(
      true,
    );
  });

  it('id を含めても strip される', () => {
    const result = MonsterCompanyCheckUpdateSchema.safeParse({ id: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });

  it('jobTargetId を含めても strip される', () => {
    const result = MonsterCompanyCheckUpdateSchema.safeParse({ jobTargetId: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('jobTargetId');
    }
  });
});
