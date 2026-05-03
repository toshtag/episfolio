import { describe, expect, it } from 'vitest';
import {
  SalaryBenchmarkCreateSchema,
  SalaryBenchmarkSchema,
  SalaryBenchmarkUpdateSchema,
} from '../../src/schemas/salary-benchmark.js';

const base = {
  id: '01SB00001',
  jobTargetId: '01JT00001',
  averageSalaryAtCompany: 620,
  expectedSalaryRangeMin: 450,
  expectedSalaryRangeMax: 700,
  personalSalaryBenchmark: 550,
  isMismatchedCompany: false,
  dataSource: 'EDINET 有価証券報告書 2023年度',
  note: 'A業界35歳の平均は500万円。求人レンジは妥当範囲内。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('SalaryBenchmarkSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(SalaryBenchmarkSchema.safeParse(base).success).toBe(true);
  });

  it('nullable フィールドが null でも受理', () => {
    const input = {
      ...base,
      averageSalaryAtCompany: null,
      expectedSalaryRangeMin: null,
      expectedSalaryRangeMax: null,
      personalSalaryBenchmark: null,
      dataSource: null,
      note: null,
    };
    expect(SalaryBenchmarkSchema.safeParse(input).success).toBe(true);
  });

  it('isMismatchedCompany が true でも受理', () => {
    expect(SalaryBenchmarkSchema.safeParse({ ...base, isMismatchedCompany: true }).success).toBe(
      true,
    );
  });

  it('給与が 0 でも受理', () => {
    expect(SalaryBenchmarkSchema.safeParse({ ...base, averageSalaryAtCompany: 0 }).success).toBe(
      true,
    );
  });

  it('給与が負数を拒否', () => {
    expect(SalaryBenchmarkSchema.safeParse({ ...base, averageSalaryAtCompany: -1 }).success).toBe(
      false,
    );
  });

  it('給与が非整数を拒否', () => {
    expect(
      SalaryBenchmarkSchema.safeParse({ ...base, averageSalaryAtCompany: 500.5 }).success,
    ).toBe(false);
  });

  it('id が空文字を拒否', () => {
    expect(SalaryBenchmarkSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('jobTargetId が空文字を拒否', () => {
    expect(SalaryBenchmarkSchema.safeParse({ ...base, jobTargetId: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = base;
    expect(SalaryBenchmarkSchema.safeParse(withoutId).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = base;
    expect(SalaryBenchmarkSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });
});

describe('SalaryBenchmarkCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(SalaryBenchmarkCreateSchema.safeParse(input).success).toBe(true);
  });

  it('入力に createdAt を含めても strip される', () => {
    const result = SalaryBenchmarkCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('createdAt');
      expect(result.data).not.toHaveProperty('updatedAt');
    }
  });

  it('jobTargetId が必須', () => {
    const { createdAt: _c, updatedAt: _u, jobTargetId: _jt, ...withoutJobTarget } = base;
    expect(SalaryBenchmarkCreateSchema.safeParse(withoutJobTarget).success).toBe(false);
  });
});

describe('SalaryBenchmarkUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(SalaryBenchmarkUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('isMismatchedCompany のみ更新できる', () => {
    expect(SalaryBenchmarkUpdateSchema.safeParse({ isMismatchedCompany: true }).success).toBe(true);
  });

  it('averageSalaryAtCompany を null に更新できる', () => {
    expect(SalaryBenchmarkUpdateSchema.safeParse({ averageSalaryAtCompany: null }).success).toBe(
      true,
    );
  });

  it('note を更新できる', () => {
    expect(SalaryBenchmarkUpdateSchema.safeParse({ note: '再調査が必要' }).success).toBe(true);
  });

  it('id を含めても strip される', () => {
    const result = SalaryBenchmarkUpdateSchema.safeParse({ id: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });

  it('jobTargetId を含めても strip される', () => {
    const result = SalaryBenchmarkUpdateSchema.safeParse({ jobTargetId: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('jobTargetId');
    }
  });
});
