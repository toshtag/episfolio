import { describe, expect, it } from 'vitest';
import type { MonsterCompanyCheck } from '../../src/domain/monster-company-check.js';
import { toMonsterCompanyCheckMarkdown } from '../../src/exporters/monster-company-check.js';

const buildRecord = (overrides: Partial<MonsterCompanyCheck> = {}): MonsterCompanyCheck => ({
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
  ...overrides,
});

describe('toMonsterCompanyCheckMarkdown', () => {
  it('H1 タイトルを含む', () => {
    expect(toMonsterCompanyCheckMarkdown(buildRecord())).toContain('# モンスター企業チェック');
  });

  it('厚労省公表事案セクションを含む', () => {
    expect(toMonsterCompanyCheckMarkdown(buildRecord())).toContain('## 厚労省公表事案');
  });

  it('退職エントリセクションを含む', () => {
    expect(toMonsterCompanyCheckMarkdown(buildRecord())).toContain('## 退職エントリ');
  });

  it('隠れモンスター部署メモセクションを含む', () => {
    expect(toMonsterCompanyCheckMarkdown(buildRecord())).toContain('## 隠れモンスター部署メモ');
  });

  it('公表日が出力される', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord());
    expect(md).toContain('**公表日**: 2024-03-15');
  });

  it('違反法条が出力される', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord());
    expect(md).toContain('**違反法条**: 労働基準法第32条');
  });

  it('事案概要が出力される', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord());
    expect(md).toContain('**事案概要**: 時間外労働が月100時間を超える違反');
  });

  it('公表事案 URL が出力される', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord());
    expect(md).toContain('**公表事案 URL**: https://example.com/case');
  });

  it('退職エントリの URL と要約が出力される', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord());
    expect(md).toContain('**URL**: https://example.com/quit');
    expect(md).toContain('**要約**: 残業が多くて退職');
  });

  it('退職エントリが空のとき「（記録なし）」を出力する', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord({ resignationEntries: [] }));
    expect(md).toContain('（記録なし）');
  });

  it('隠れモンスター部署メモが出力される', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord());
    expect(md).toContain('開発部署のみ深夜残業常態化との口コミあり');
  });

  it('mhlwCaseUrl が null のとき「（未記入）」になる', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord({ mhlwCaseUrl: null }));
    expect(md).toContain('**公表事案 URL**: （未記入）');
  });

  it('violationLaw が null のとき「（未記入）」になる', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord({ violationLaw: null }));
    expect(md).toContain('**違反法条**: （未記入）');
  });

  it('caseSummary が null のとき「（未記入）」になる', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord({ caseSummary: null }));
    expect(md).toContain('**事案概要**: （未記入）');
  });

  it('hiddenMonsterNote が null のとき「（未記入）」になる', () => {
    const md = toMonsterCompanyCheckMarkdown(buildRecord({ hiddenMonsterNote: null }));
    const sections = md.split('## 隠れモンスター部署メモ');
    expect(sections[1]).toContain('（未記入）');
  });

  it('複数の退職エントリが番号付きで出力される', () => {
    const record = buildRecord({
      resignationEntries: [
        { url: 'https://a.com', summary: '要約A' },
        { url: 'https://b.com', summary: '要約B' },
      ],
    });
    const md = toMonsterCompanyCheckMarkdown(record);
    expect(md).toContain('### 1. 退職エントリ');
    expect(md).toContain('### 2. 退職エントリ');
    expect(md).toContain('要約A');
    expect(md).toContain('要約B');
  });

  it('出力に "null" 文字列を含まない', () => {
    const record = buildRecord({
      mhlwCaseUrl: null,
      violationLaw: null,
      caseSummary: null,
      casePublicationDate: null,
      hiddenMonsterNote: null,
      resignationEntries: [],
    });
    expect(toMonsterCompanyCheckMarkdown(record)).not.toContain('null');
  });
});
