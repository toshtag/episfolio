import { describe, expect, it } from 'vitest';
import type { BusinessUnitTypeMatch } from '../../src/domain/business-unit-type-match.js';
import { toBusinessUnitTypeMatchMarkdown } from '../../src/exporters/business-unit-type-match.js';

const base: BusinessUnitTypeMatch = {
  id: '01BU00001',
  jobTargetId: '01JT00001',
  companyUnitType: 'star',
  selfType: 'challenge',
  isMatchConfirmed: false,
  matchNote: '企業は花形だが自己はチャレンジ型。方向性を検討中。',
  motivationDraft: '向上心を持ちつつ企業の中長期成長に貢献したい。',
  note: '面談で詳細確認予定。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('toBusinessUnitTypeMatchMarkdown', () => {
  it('タイトルを含む', () => {
    const md = toBusinessUnitTypeMatchMarkdown(base);
    expect(md).toContain('# 事業部タイプ相性チェック');
  });

  it('企業の事業部タイプが花形で出力される', () => {
    const md = toBusinessUnitTypeMatchMarkdown(base);
    expect(md).toContain('花形事業部（スター）');
  });

  it('selfType がチャレンジで出力される', () => {
    const md = toBusinessUnitTypeMatchMarkdown(base);
    expect(md).toContain('チャレンジ事業部');
  });

  it('isMatchConfirmed が false のとき未確認と出力される', () => {
    const md = toBusinessUnitTypeMatchMarkdown(base);
    expect(md).toContain('❌ 未確認');
  });

  it('isMatchConfirmed が true のとき確認済みと出力される', () => {
    const md = toBusinessUnitTypeMatchMarkdown({ ...base, isMatchConfirmed: true });
    expect(md).toContain('✅ 一致確認済み');
  });

  it('companyUnitType が support のとき縁の下で出力される', () => {
    const md = toBusinessUnitTypeMatchMarkdown({ ...base, companyUnitType: 'support' });
    expect(md).toContain('縁の下の力持ち事業部');
  });

  it('companyUnitType が turnaround のとき立て直しで出力される', () => {
    const md = toBusinessUnitTypeMatchMarkdown({ ...base, companyUnitType: 'turnaround' });
    expect(md).toContain('立て直し事業部');
  });

  it('companyUnitType が null のとき未記入プレースホルダー', () => {
    const md = toBusinessUnitTypeMatchMarkdown({ ...base, companyUnitType: null });
    expect(md).toContain('（未記入）');
  });

  it('selfType が null のとき未記入プレースホルダー', () => {
    const md = toBusinessUnitTypeMatchMarkdown({ ...base, selfType: null });
    const count = (md.match(/（未記入）/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('matchNote が出力される', () => {
    const md = toBusinessUnitTypeMatchMarkdown(base);
    expect(md).toContain('企業は花形だが自己はチャレンジ型。方向性を検討中。');
  });

  it('motivationDraft が出力される', () => {
    const md = toBusinessUnitTypeMatchMarkdown(base);
    expect(md).toContain('向上心を持ちつつ企業の中長期成長に貢献したい。');
  });

  it('note が出力される', () => {
    const md = toBusinessUnitTypeMatchMarkdown(base);
    expect(md).toContain('面談で詳細確認予定。');
  });

  it('matchNote が null のとき未記入プレースホルダー', () => {
    const md = toBusinessUnitTypeMatchMarkdown({ ...base, matchNote: null });
    expect(md).toContain('（未記入）');
  });

  it('motivationDraft が null のとき未記入プレースホルダー', () => {
    const md = toBusinessUnitTypeMatchMarkdown({ ...base, motivationDraft: null });
    expect(md).toContain('（未記入）');
  });

  it('note が null のとき未記入プレースホルダー', () => {
    const md = toBusinessUnitTypeMatchMarkdown({ ...base, note: null });
    expect(md).toContain('（未記入）');
  });

  it('各セクションヘッダーを含む', () => {
    const md = toBusinessUnitTypeMatchMarkdown(base);
    expect(md).toContain('## 企業の事業部タイプ');
    expect(md).toContain('## 自己タイプ');
    expect(md).toContain('## タイプ一致確認');
    expect(md).toContain('## マッチング分析メモ');
    expect(md).toContain('## 志望動機ドラフト');
    expect(md).toContain('## 総合メモ');
  });
});
