import { describe, expect, it } from 'vitest';
import {
  LifeTimelineCategorySchema,
  LifeTimelineEntrySchema,
  LifeTimelineEntryUpdateSchema,
} from '../../src/schemas/life-timeline-entry.js';

const baseEntry = {
  id: '01HXXXX',
  ageRangeStart: 20,
  ageRangeEnd: 25,
  yearStart: 2020,
  yearEnd: 2025,
  category: 'work' as const,
  summary: '初職',
  detail: '',
  tags: [],
  createdAt: '2026-04-30T00:00:00Z',
  updatedAt: '2026-04-30T00:00:00Z',
};

describe('LifeTimelineCategorySchema', () => {
  it('既知の値を受け入れる', () => {
    for (const v of ['education', 'work', 'family', 'health', 'hobby', 'other']) {
      expect(LifeTimelineCategorySchema.safeParse(v).success).toBe(true);
    }
  });

  it('未知の値を拒否する', () => {
    expect(LifeTimelineCategorySchema.safeParse('career').success).toBe(false);
    expect(LifeTimelineCategorySchema.safeParse('').success).toBe(false);
  });
});

describe('LifeTimelineEntrySchema', () => {
  it('正常系: ageRangeStart < ageRangeEnd', () => {
    expect(LifeTimelineEntrySchema.safeParse(baseEntry).success).toBe(true);
  });

  it('境界: ageRangeStart === ageRangeEnd は許可', () => {
    const same = { ...baseEntry, ageRangeStart: 30, ageRangeEnd: 30 };
    expect(LifeTimelineEntrySchema.safeParse(same).success).toBe(true);
  });

  it('境界: ageRangeStart > ageRangeEnd は拒否', () => {
    const invalid = { ...baseEntry, ageRangeStart: 30, ageRangeEnd: 25 };
    const result = LifeTimelineEntrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(' / ');
      expect(message).toContain('ageRangeStart');
    }
  });

  it('ageRangeStart 負数は拒否', () => {
    const invalid = { ...baseEntry, ageRangeStart: -1 };
    expect(LifeTimelineEntrySchema.safeParse(invalid).success).toBe(false);
  });

  it('summary 空文字は拒否', () => {
    const invalid = { ...baseEntry, summary: '' };
    expect(LifeTimelineEntrySchema.safeParse(invalid).success).toBe(false);
  });

  it('yearStart / yearEnd は null 許可', () => {
    const entry = { ...baseEntry, yearStart: null, yearEnd: null };
    expect(LifeTimelineEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('未知の category を拒否', () => {
    const invalid = { ...baseEntry, category: 'career' as unknown as 'work' };
    expect(LifeTimelineEntrySchema.safeParse(invalid).success).toBe(false);
  });
});

describe('LifeTimelineEntryUpdateSchema', () => {
  it('partial: 一部フィールドだけ送れる', () => {
    expect(LifeTimelineEntryUpdateSchema.safeParse({ summary: '更新' }).success).toBe(true);
    expect(LifeTimelineEntryUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('partial: 個々のフィールドの型は守られる', () => {
    expect(LifeTimelineEntryUpdateSchema.safeParse({ ageRangeStart: -1 }).success).toBe(false);
    expect(LifeTimelineEntryUpdateSchema.safeParse({ summary: '' }).success).toBe(false);
    expect(
      LifeTimelineEntryUpdateSchema.safeParse({ category: 'unknown' as unknown as 'work' }).success,
    ).toBe(false);
  });

  it('partial: ageRange の関係性は検証しない（Rust 側で merge 後に確認する方針）', () => {
    // 片方だけ更新する正当なケースを許可するため、UpdateSchema は refine を持たない
    expect(
      LifeTimelineEntryUpdateSchema.safeParse({ ageRangeStart: 30, ageRangeEnd: 25 }).success,
    ).toBe(true);
  });
});
