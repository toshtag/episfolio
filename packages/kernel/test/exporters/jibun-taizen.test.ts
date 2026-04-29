import { describe, expect, it } from 'vitest';
import type { LifeTimelineEntry } from '../../src/domain/life-timeline-entry.js';
import { toJibunTaizenMarkdown } from '../../src/exporters/jibun-taizen.js';

const buildEntry = (overrides: Partial<LifeTimelineEntry> & { id: string }): LifeTimelineEntry => ({
  ageRangeStart: 22,
  ageRangeEnd: 24,
  yearStart: 2010,
  yearEnd: 2012,
  category: 'work',
  summary: '新卒で入社',
  detail: '',
  relatedEpisodeIds: [],
  tags: [],
  createdAt: '2026-04-29T00:00:00Z',
  updatedAt: '2026-04-29T00:00:00Z',
  ...overrides,
});

describe('toJibunTaizenMarkdown', () => {
  it('ヘッダーと表ヘッダーを含む', () => {
    const md = toJibunTaizenMarkdown([buildEntry({ id: '01' })]);
    expect(md).toContain('# 自分大全');
    expect(md).toContain('| 年齢 | 年 | カテゴリ | 概要 | タグ |');
  });

  it('年齢範囲が同じ場合「22歳」と表示される', () => {
    const md = toJibunTaizenMarkdown([
      buildEntry({ id: '01', ageRangeStart: 22, ageRangeEnd: 22 }),
    ]);
    expect(md).toContain('| 22歳 |');
  });

  it('年齢範囲が異なる場合「22〜24歳」と表示される', () => {
    const md = toJibunTaizenMarkdown([
      buildEntry({ id: '01', ageRangeStart: 22, ageRangeEnd: 24 }),
    ]);
    expect(md).toContain('| 22〜24歳 |');
  });

  it('yearStart のみの場合「2010」と表示される', () => {
    const md = toJibunTaizenMarkdown([buildEntry({ id: '01', yearStart: 2010, yearEnd: null })]);
    expect(md).toContain('| 2010 |');
  });

  it('yearStart == yearEnd の場合「2010」と表示される', () => {
    const md = toJibunTaizenMarkdown([buildEntry({ id: '01', yearStart: 2010, yearEnd: 2010 })]);
    expect(md).toContain('| 2010 |');
  });

  it('yearStart/End が異なる場合「2010〜2012」と表示される', () => {
    const md = toJibunTaizenMarkdown([buildEntry({ id: '01', yearStart: 2010, yearEnd: 2012 })]);
    expect(md).toContain('| 2010〜2012 |');
  });

  it('yearStart が null の場合、年セルが空になる', () => {
    const md = toJibunTaizenMarkdown([buildEntry({ id: '01', yearStart: null, yearEnd: null })]);
    expect(md).toContain('|  |');
  });

  it('カテゴリが日本語に変換される', () => {
    const md = toJibunTaizenMarkdown([buildEntry({ id: '01', category: 'education' })]);
    expect(md).toContain('| 学業 |');
  });

  it('タグが「, 」区切りで表示される', () => {
    const md = toJibunTaizenMarkdown([buildEntry({ id: '01', tags: ['backend', 'SRE'] })]);
    expect(md).toContain('backend, SRE');
  });

  it('年齢昇順にソートされる', () => {
    const entries = [
      buildEntry({ id: '02', ageRangeStart: 30, summary: '転職' }),
      buildEntry({ id: '01', ageRangeStart: 18, summary: '入学' }),
    ];
    const md = toJibunTaizenMarkdown(entries);
    const idx入学 = md.indexOf('入学');
    const idx転職 = md.indexOf('転職');
    expect(idx入学).toBeLessThan(idx転職);
  });

  it('空配列のとき行のない表を返す', () => {
    const md = toJibunTaizenMarkdown([]);
    expect(md).toContain('# 自分大全');
    expect(md).toContain('| 年齢 |');
    const lines = md.split('\n').filter((l) => l.startsWith('| ') && !l.includes('年齢'));
    expect(lines).toHaveLength(0);
  });
});
