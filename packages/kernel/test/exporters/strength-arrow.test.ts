import { describe, expect, it } from 'vitest';
import type { StrengthArrow } from '../../src/domain/strength-arrow.js';
import { toStrengthArrowMarkdown } from '../../src/exporters/strength-arrow.js';

const buildArrow = (overrides: Partial<StrengthArrow> = {}): StrengthArrow => ({
  id: '01ARROW001',
  type: 'interest',
  description: 'なぜそんなに詳しいんですか？と聞かれた',
  source: '営業部の先輩',
  occurredAt: '2024-03-01',
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('toStrengthArrowMarkdown', () => {
  it('H1 タイトルを含む', () => {
    const md = toStrengthArrowMarkdown([]);
    expect(md).toContain('# 三つの矢印（強み発掘）');
  });

  it('3 種のセクションヘッダーが常に出力される', () => {
    const md = toStrengthArrowMarkdown([]);
    expect(md).toContain('## 興味（質問された経験）');
    expect(md).toContain('## 評価（褒められた経験）');
    expect(md).toContain('## 依頼（頼まれた経験）');
  });

  it('空配列のとき各セクションに「（記録なし）」が出力される', () => {
    const md = toStrengthArrowMarkdown([]);
    const count = (md.match(/（記録なし）/g) ?? []).length;
    expect(count).toBe(3);
  });

  it('interest の矢印が興味セクションに出力される', () => {
    const arrow = buildArrow({ type: 'interest', description: '詳しいと言われた' });
    const md = toStrengthArrowMarkdown([arrow]);
    const sectionIdx = md.indexOf('## 興味（質問された経験）');
    const descIdx = md.indexOf('詳しいと言われた');
    expect(descIdx).toBeGreaterThan(sectionIdx);
  });

  it('evaluation の矢印が評価セクションに出力される', () => {
    const arrow = buildArrow({ type: 'evaluation', description: '褒められた内容' });
    const md = toStrengthArrowMarkdown([arrow]);
    const sectionIdx = md.indexOf('## 評価（褒められた経験）');
    const descIdx = md.indexOf('褒められた内容');
    expect(descIdx).toBeGreaterThan(sectionIdx);
  });

  it('request の矢印が依頼セクションに出力される', () => {
    const arrow = buildArrow({ type: 'request', description: '頼まれた経験' });
    const md = toStrengthArrowMarkdown([arrow]);
    const sectionIdx = md.indexOf('## 依頼（頼まれた経験）');
    const descIdx = md.indexOf('頼まれた経験');
    expect(descIdx).toBeGreaterThan(sectionIdx);
  });

  it('source が出力される', () => {
    const arrow = buildArrow({ source: '上司の田中さん' });
    const md = toStrengthArrowMarkdown([arrow]);
    expect(md).toContain('**相手**: 上司の田中さん');
  });

  it('occurredAt が null のとき時期行を出力しない', () => {
    const arrow = buildArrow({ occurredAt: null });
    const md = toStrengthArrowMarkdown([arrow]);
    expect(md).not.toContain('**時期**');
  });

  it('occurredAt があるとき時期行を出力する', () => {
    const arrow = buildArrow({ occurredAt: '2024-03-01' });
    const md = toStrengthArrowMarkdown([arrow]);
    expect(md).toContain('**時期**: 2024-03-01');
  });

  it('relatedEpisodeIds が空のとき関連エピソード行を出力しない', () => {
    const arrow = buildArrow({ relatedEpisodeIds: [] });
    const md = toStrengthArrowMarkdown([arrow]);
    expect(md).not.toContain('**関連エピソード**');
  });

  it('relatedEpisodeIds があるとき出力する', () => {
    const arrow = buildArrow({ relatedEpisodeIds: ['01EP0001', '01EP0002'] });
    const md = toStrengthArrowMarkdown([arrow]);
    expect(md).toContain('**関連エピソード**: 01EP0001, 01EP0002');
  });

  it('note が null のとき出力しない', () => {
    const arrow = buildArrow({ note: null });
    const md = toStrengthArrowMarkdown([arrow]);
    expect(md).not.toContain('**メモ**');
  });

  it('note があるとき出力する', () => {
    const arrow = buildArrow({ note: '面接で追加説明する' });
    const md = toStrengthArrowMarkdown([arrow]);
    expect(md).toContain('**メモ**: 面接で追加説明する');
  });

  it('description が空文字のとき「（未記入）」に置換される', () => {
    const arrow = buildArrow({ description: '' });
    const md = toStrengthArrowMarkdown([arrow]);
    expect(md).toContain('（未記入）');
  });

  it('source が空文字のとき「（未記入）」に置換される', () => {
    const arrow = buildArrow({ source: '' });
    const md = toStrengthArrowMarkdown([arrow]);
    expect(md).toContain('**相手**: （未記入）');
  });

  it('複数の矢印が番号付きで順序通り出力される', () => {
    const arrows: StrengthArrow[] = [
      buildArrow({ id: '01ARROW001', type: 'interest', description: '一つ目' }),
      buildArrow({ id: '01ARROW002', type: 'interest', description: '二つ目' }),
    ];
    const md = toStrengthArrowMarkdown(arrows);
    const idx1 = md.indexOf('### 1. 一つ目');
    const idx2 = md.indexOf('### 2. 二つ目');
    expect(idx1).toBeGreaterThanOrEqual(0);
    expect(idx2).toBeGreaterThan(idx1);
  });

  it('セクション順序は interest → evaluation → request', () => {
    const md = toStrengthArrowMarkdown([]);
    const iIdx = md.indexOf('## 興味');
    const eIdx = md.indexOf('## 評価');
    const rIdx = md.indexOf('## 依頼');
    expect(iIdx).toBeGreaterThanOrEqual(0);
    expect(eIdx).toBeGreaterThan(iIdx);
    expect(rIdx).toBeGreaterThan(eIdx);
  });

  it('出力に "null" 文字列を含まない', () => {
    const arrow = buildArrow({ occurredAt: null, note: null });
    const md = toStrengthArrowMarkdown([arrow]);
    expect(md).not.toContain('null');
  });
});
