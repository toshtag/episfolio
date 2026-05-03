import { describe, expect, it } from 'vitest';
import type { SalaryBenchmark } from '../../src/domain/salary-benchmark.js';
import { toSalaryBenchmarkMarkdown } from '../../src/exporters/salary-benchmark.js';

const buildRecord = (overrides: Partial<SalaryBenchmark> = {}): SalaryBenchmark => ({
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
  ...overrides,
});

describe('toSalaryBenchmarkMarkdown', () => {
  it('H1 タイトルを含む', () => {
    expect(toSalaryBenchmarkMarkdown(buildRecord())).toContain('# 給料分析');
  });

  it('企業の平均年間給与セクションを含む', () => {
    expect(toSalaryBenchmarkMarkdown(buildRecord())).toContain('## 企業の平均年間給与');
  });

  it('求人票の年収レンジセクションを含む', () => {
    expect(toSalaryBenchmarkMarkdown(buildRecord())).toContain('## 求人票の年収レンジ');
  });

  it('自分の給与相場セクションを含む', () => {
    expect(toSalaryBenchmarkMarkdown(buildRecord())).toContain('## 自分の給与相場');
  });

  it('見合わない企業フラグセクションを含む', () => {
    expect(toSalaryBenchmarkMarkdown(buildRecord())).toContain('## 「見合わない企業」フラグ');
  });

  it('参照情報源セクションを含む', () => {
    expect(toSalaryBenchmarkMarkdown(buildRecord())).toContain('## 参照情報源');
  });

  it('メモセクションを含む', () => {
    expect(toSalaryBenchmarkMarkdown(buildRecord())).toContain('## メモ');
  });

  it('企業平均給与の数値が出力される', () => {
    const md = toSalaryBenchmarkMarkdown(buildRecord({ averageSalaryAtCompany: 620 }));
    expect(md).toContain('620');
    expect(md).toContain('万円');
  });

  it('求人票レンジの下限・上限が出力される', () => {
    const md = toSalaryBenchmarkMarkdown(
      buildRecord({ expectedSalaryRangeMin: 450, expectedSalaryRangeMax: 700 }),
    );
    expect(md).toContain('450');
    expect(md).toContain('700');
    expect(md).toContain('〜');
  });

  it('見合わない企業フラグが false のとき「✅ 問題なし」', () => {
    const md = toSalaryBenchmarkMarkdown(buildRecord({ isMismatchedCompany: false }));
    expect(md).toContain('✅ 問題なし');
  });

  it('見合わない企業フラグが true のとき「⚠️ 見合わない企業」', () => {
    const md = toSalaryBenchmarkMarkdown(buildRecord({ isMismatchedCompany: true }));
    expect(md).toContain('⚠️ 見合わない企業');
  });

  it('dataSource の内容が出力される', () => {
    const md = toSalaryBenchmarkMarkdown(buildRecord());
    expect(md).toContain('EDINET 有価証券報告書 2023年度');
  });

  it('note の内容が出力される', () => {
    const md = toSalaryBenchmarkMarkdown(buildRecord());
    expect(md).toContain('A業界35歳の平均は500万円');
  });

  it('averageSalaryAtCompany が null のとき「（未記入）」になる', () => {
    const md = toSalaryBenchmarkMarkdown(buildRecord({ averageSalaryAtCompany: null }));
    const sections = md.split('## 企業の平均年間給与');
    expect(sections[1]).toContain('（未記入）');
  });

  it('expectedSalaryRangeMin と Max が両方 null のとき「（未記入）」になる', () => {
    const md = toSalaryBenchmarkMarkdown(
      buildRecord({ expectedSalaryRangeMin: null, expectedSalaryRangeMax: null }),
    );
    const sections = md.split('## 求人票の年収レンジ');
    expect(sections[1]).toContain('（未記入）');
  });

  it('expectedSalaryRangeMin のみ null のとき「下限不明」を出力する', () => {
    const md = toSalaryBenchmarkMarkdown(
      buildRecord({ expectedSalaryRangeMin: null, expectedSalaryRangeMax: 700 }),
    );
    expect(md).toContain('下限不明');
    expect(md).toContain('700');
  });

  it('expectedSalaryRangeMax のみ null のとき「上限不明」を出力する', () => {
    const md = toSalaryBenchmarkMarkdown(
      buildRecord({ expectedSalaryRangeMin: 450, expectedSalaryRangeMax: null }),
    );
    expect(md).toContain('450');
    expect(md).toContain('上限不明');
  });

  it('dataSource が null のとき「（未記入）」になる', () => {
    const md = toSalaryBenchmarkMarkdown(buildRecord({ dataSource: null }));
    const sections = md.split('## 参照情報源');
    expect(sections[1]).toContain('（未記入）');
  });

  it('note が null のとき「（未記入）」になる', () => {
    const md = toSalaryBenchmarkMarkdown(buildRecord({ note: null }));
    const sections = md.split('## メモ');
    expect(sections[1]).toContain('（未記入）');
  });

  it('出力に "null" 文字列を含まない', () => {
    const record = buildRecord({
      averageSalaryAtCompany: null,
      expectedSalaryRangeMin: null,
      expectedSalaryRangeMax: null,
      personalSalaryBenchmark: null,
      dataSource: null,
      note: null,
    });
    expect(toSalaryBenchmarkMarkdown(record)).not.toContain('null');
  });
});
