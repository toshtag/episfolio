import { describe, expect, it } from 'vitest';
import type { GrowthCycleNote } from '../../src/domain/growth-cycle-note.js';
import { toGrowthCycleNoteMarkdown } from '../../src/exporters/growth-cycle-note.js';

const buildRecord = (overrides: Partial<GrowthCycleNote> = {}): GrowthCycleNote => ({
  id: '01GC00001',
  jobTargetId: '01JT00001',
  growthStage: 'stable_expansion',
  stageNote: '売上安定、黒字化継続。仕組み整備フェーズ。',
  isLongTermSuitable: true,
  note: '腰を据えて長く働ける環境が整っている。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('toGrowthCycleNoteMarkdown', () => {
  it('H1 タイトルを含む', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord())).toContain('# 企業の成長サイクル分析');
  });

  it('成長段階セクションを含む', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord())).toContain('## 成長段階');
  });

  it('成長段階のメモセクションを含む', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord())).toContain('## 成長段階のメモ');
  });

  it('長期就労の適性セクションを含む', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord())).toContain('## 長期就労の適性');
  });

  it('総合メモセクションを含む', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord())).toContain('## 総合メモ');
  });

  it('stable_expansion のとき「安定・拡大期」を出力する', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord({ growthStage: 'stable_expansion' }))).toContain(
      '安定・拡大期',
    );
  });

  it('growth のとき「成長初期」を出力する', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord({ growthStage: 'growth' }))).toContain('成長初期');
  });

  it('startup のとき「創業期」を出力する', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord({ growthStage: 'startup' }))).toContain('創業期');
  });

  it('growthStage が null のとき「（未記入）」になる', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord({ growthStage: null }))).toContain('（未記入）');
  });

  it('isLongTermSuitable が true のとき「✅」を出力する', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord({ isLongTermSuitable: true }))).toContain('✅');
  });

  it('isLongTermSuitable が false のとき「⚠️」を出力する', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord({ isLongTermSuitable: false }))).toContain('⚠️');
  });

  it('stageNote の内容が出力される', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord())).toContain('黒字化継続');
  });

  it('note の内容が出力される', () => {
    expect(toGrowthCycleNoteMarkdown(buildRecord())).toContain('腰を据えて');
  });

  it('stageNote が null のとき「（未記入）」になる', () => {
    const md = toGrowthCycleNoteMarkdown(buildRecord({ stageNote: null }));
    const sections = md.split('## 成長段階のメモ');
    expect(sections[1]).toContain('（未記入）');
  });

  it('note が null のとき「（未記入）」になる', () => {
    const md = toGrowthCycleNoteMarkdown(buildRecord({ note: null }));
    const sections = md.split('## 総合メモ');
    expect(sections[1]).toContain('（未記入）');
  });

  it('出力に "null" 文字列を含まない', () => {
    const record = buildRecord({ growthStage: null, stageNote: null, note: null });
    expect(toGrowthCycleNoteMarkdown(record)).not.toContain('null');
  });
});
