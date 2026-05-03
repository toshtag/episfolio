import { describe, expect, it } from 'vitest';
import type { HiddenGemNote } from '../../src/domain/hidden-gem-note.js';
import { toHiddenGemNoteMarkdown } from '../../src/exporters/hidden-gem-note.js';

const buildRecord = (overrides: Partial<HiddenGemNote> = {}): HiddenGemNote => ({
  id: '01HG00001',
  jobTargetId: '01JT00001',
  isGntListed: true,
  nicheKeywords: 'ニッチトップ シェアNO.1 独自技術',
  hasAntiMonsterMechanism: true,
  mechanismNote: '他社に提供できない独自商品→余裕ある経営→社員を大切にする好循環',
  isHiringOnJobSites: false,
  directContactNote: '採用ページから直接応募。人事担当に連絡済み。',
  note: '経産省GNT100選掲載。モンスター化しにくい好循環が確認できた。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('toHiddenGemNoteMarkdown', () => {
  it('H1 タイトルを含む', () => {
    expect(toHiddenGemNoteMarkdown(buildRecord())).toContain('# 隠れた優良企業チェック');
  });

  it('GNT企業100選への掲載セクションを含む', () => {
    expect(toHiddenGemNoteMarkdown(buildRecord())).toContain('## GNT企業100選への掲載');
  });

  it('検索キーワードセクションを含む', () => {
    expect(toHiddenGemNoteMarkdown(buildRecord())).toContain('## 検索キーワード');
  });

  it('モンスター企業になりにくい仕組みセクションを含む', () => {
    expect(toHiddenGemNoteMarkdown(buildRecord())).toContain('## モンスター企業になりにくい仕組み');
  });

  it('転職サイトでの採用状況セクションを含む', () => {
    expect(toHiddenGemNoteMarkdown(buildRecord())).toContain('## 転職サイトでの採用状況');
  });

  it('直接コンタクトのメモセクションを含む', () => {
    expect(toHiddenGemNoteMarkdown(buildRecord())).toContain('## 直接コンタクトのメモ');
  });

  it('総合メモセクションを含む', () => {
    expect(toHiddenGemNoteMarkdown(buildRecord())).toContain('## 総合メモ');
  });

  it('isGntListed が true のとき「✅ 掲載あり」を出力する', () => {
    expect(toHiddenGemNoteMarkdown(buildRecord({ isGntListed: true }))).toContain('✅ 掲載あり');
  });

  it('isGntListed が false のとき「❌ 掲載なし」を出力する', () => {
    expect(toHiddenGemNoteMarkdown(buildRecord({ isGntListed: false }))).toContain('❌ 掲載なし');
  });

  it('hasAntiMonsterMechanism が true のとき「✅ 仕組みあり」を出力する', () => {
    expect(
      toHiddenGemNoteMarkdown(buildRecord({ hasAntiMonsterMechanism: true })),
    ).toContain('✅ 仕組みあり');
  });

  it('hasAntiMonsterMechanism が false のとき「❌ 確認できず」を出力する', () => {
    expect(
      toHiddenGemNoteMarkdown(buildRecord({ hasAntiMonsterMechanism: false })),
    ).toContain('❌ 確認できず');
  });

  it('isHiringOnJobSites が false のとき「直接コンタクト要」を出力する', () => {
    expect(
      toHiddenGemNoteMarkdown(buildRecord({ isHiringOnJobSites: false })),
    ).toContain('直接コンタクト要');
  });

  it('isHiringOnJobSites が true のとき「転職サイトで募集中」を出力する', () => {
    expect(
      toHiddenGemNoteMarkdown(buildRecord({ isHiringOnJobSites: true })),
    ).toContain('転職サイトで募集中');
  });

  it('nicheKeywords の内容が出力される', () => {
    const md = toHiddenGemNoteMarkdown(buildRecord());
    expect(md).toContain('ニッチトップ');
  });

  it('mechanismNote の内容が出力される', () => {
    const md = toHiddenGemNoteMarkdown(buildRecord());
    expect(md).toContain('好循環');
  });

  it('directContactNote の内容が出力される', () => {
    const md = toHiddenGemNoteMarkdown(buildRecord());
    expect(md).toContain('採用ページから直接応募');
  });

  it('note の内容が出力される', () => {
    const md = toHiddenGemNoteMarkdown(buildRecord());
    expect(md).toContain('GNT100選掲載');
  });

  it('nicheKeywords が null のとき「（未記入）」になる', () => {
    const md = toHiddenGemNoteMarkdown(buildRecord({ nicheKeywords: null }));
    const sections = md.split('## 検索キーワード');
    expect(sections[1]).toContain('（未記入）');
  });

  it('mechanismNote が null のとき「（未記入）」になる', () => {
    const md = toHiddenGemNoteMarkdown(buildRecord({ mechanismNote: null }));
    const sections = md.split('## モンスター企業になりにくい仕組み');
    expect(sections[1]).toContain('（未記入）');
  });

  it('directContactNote が null のとき「（未記入）」になる', () => {
    const md = toHiddenGemNoteMarkdown(buildRecord({ directContactNote: null }));
    const sections = md.split('## 直接コンタクトのメモ');
    expect(sections[1]).toContain('（未記入）');
  });

  it('note が null のとき「（未記入）」になる', () => {
    const md = toHiddenGemNoteMarkdown(buildRecord({ note: null }));
    const sections = md.split('## 総合メモ');
    expect(sections[1]).toContain('（未記入）');
  });

  it('出力に "null" 文字列を含まない', () => {
    const record = buildRecord({
      nicheKeywords: null,
      mechanismNote: null,
      directContactNote: null,
      note: null,
    });
    expect(toHiddenGemNoteMarkdown(record)).not.toContain('null');
  });
});
