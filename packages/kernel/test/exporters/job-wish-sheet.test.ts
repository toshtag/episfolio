import { describe, expect, it } from 'vitest';
import type { JobWishSheet } from '../../src/domain/job-wish-sheet.js';
import { toJobWishSheetMarkdown } from '../../src/exporters/job-wish-sheet.js';

const buildSheet = (overrides: Partial<JobWishSheet> = {}): JobWishSheet => ({
  id: '01WISH001',
  agentTrackRecordId: null,
  title: '転職希望シート 2026',
  desiredIndustry: 'IT・Web',
  desiredRole: 'プロダクトマネージャー',
  desiredSalary: '800万円以上',
  desiredLocation: '東京・リモート可',
  desiredWorkStyle: 'フレックス・週3在宅',
  otherConditions: '',
  groupACompanies: [],
  groupBCompanies: [],
  groupCCompanies: [],
  memo: '',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('toJobWishSheetMarkdown', () => {
  it('タイトルが見出しに反映される', () => {
    const md = toJobWishSheetMarkdown(buildSheet());
    expect(md).toContain('# 転職希望シート 2026');
  });

  it('タイトルが空の場合はデフォルト見出しになる', () => {
    const md = toJobWishSheetMarkdown(buildSheet({ title: '' }));
    expect(md).toContain('# 転職希望シート');
  });

  it('希望条件が全て出力される', () => {
    const md = toJobWishSheetMarkdown(buildSheet());
    expect(md).toContain('- 希望業界: IT・Web');
    expect(md).toContain('- 希望職種: プロダクトマネージャー');
    expect(md).toContain('- 希望年収: 800万円以上');
    expect(md).toContain('- 希望勤務地: 東京・リモート可');
    expect(md).toContain('- 希望働き方: フレックス・週3在宅');
  });

  it('空の希望条件フィールドは出力されない', () => {
    const md = toJobWishSheetMarkdown(buildSheet({ otherConditions: '' }));
    expect(md).not.toContain('その他条件');
  });

  it('希望条件が全て空のとき「（未入力）」が出る', () => {
    const md = toJobWishSheetMarkdown(
      buildSheet({
        desiredIndustry: '',
        desiredRole: '',
        desiredSalary: '',
        desiredLocation: '',
        desiredWorkStyle: '',
        otherConditions: '',
      }),
    );
    expect(md).toContain('（未入力）');
  });

  it('A グループに企業が出力される', () => {
    const md = toJobWishSheetMarkdown(
      buildSheet({
        groupACompanies: [{ id: '01COMP01', name: '株式会社アルファ', note: '製品志向が強い' }],
      }),
    );
    expect(md).toContain('- 株式会社アルファ — 製品志向が強い');
  });

  it('note が空の企業は社名のみ出力される', () => {
    const md = toJobWishSheetMarkdown(
      buildSheet({
        groupBCompanies: [{ id: '01COMP02', name: '株式会社ベータ', note: '' }],
      }),
    );
    expect(md).toContain('- 株式会社ベータ');
    expect(md).not.toContain('株式会社ベータ —');
  });

  it('企業が空のグループは「（なし）」が出る', () => {
    const md = toJobWishSheetMarkdown(buildSheet());
    expect(md).toContain('（なし）');
  });

  it('全グループが空のシートで正常出力される', () => {
    const md = toJobWishSheetMarkdown(
      buildSheet({
        groupACompanies: [],
        groupBCompanies: [],
        groupCCompanies: [],
      }),
    );
    expect(md).toContain('## ■ A グループ（最優先）');
    expect(md).toContain('## ■ B グループ（興味あり）');
    expect(md).toContain('## ■ C グループ（ストレッチ・保険）');
  });

  it('メモがある場合は出力される', () => {
    const md = toJobWishSheetMarkdown(buildSheet({ memo: '面談後に再評価' }));
    expect(md).toContain('## メモ');
    expect(md).toContain('面談後に再評価');
  });

  it('メモが空の場合はメモセクションが出力されない', () => {
    const md = toJobWishSheetMarkdown(buildSheet({ memo: '' }));
    expect(md).not.toContain('## メモ');
  });

  it('A/B/C グループの企業が全て出力される全項目テスト', () => {
    const md = toJobWishSheetMarkdown(
      buildSheet({
        groupACompanies: [{ id: '01A', name: 'A社', note: 'メモA' }],
        groupBCompanies: [{ id: '01B', name: 'B社', note: 'メモB' }],
        groupCCompanies: [{ id: '01C', name: 'C社', note: '' }],
        memo: 'まとめメモ',
      }),
    );
    expect(md).toContain('- A社 — メモA');
    expect(md).toContain('- B社 — メモB');
    expect(md).toContain('- C社');
    expect(md).toContain('まとめメモ');
  });
});
