import { describe, expect, it } from 'vitest';
import {
  GrowthCycleNoteCreateSchema,
  GrowthCycleNoteSchema,
  GrowthCycleNoteUpdateSchema,
  GrowthStageSchema,
} from '../../src/schemas/growth-cycle-note.js';

const base = {
  id: '01GC00001',
  jobTargetId: '01JT00001',
  growthStage: 'stable_expansion' as const,
  stageNote: '売上安定、黒字化継続。仕組み整備フェーズ。',
  isLongTermSuitable: true,
  note: '腰を据えて長く働ける環境が整っている。',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('GrowthStageSchema', () => {
  it('startup を受理', () => {
    expect(GrowthStageSchema.safeParse('startup').success).toBe(true);
  });

  it('growth を受理', () => {
    expect(GrowthStageSchema.safeParse('growth').success).toBe(true);
  });

  it('stable_expansion を受理', () => {
    expect(GrowthStageSchema.safeParse('stable_expansion').success).toBe(true);
  });

  it('不正な値を拒否', () => {
    expect(GrowthStageSchema.safeParse('decline').success).toBe(false);
  });
});

describe('GrowthCycleNoteSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(GrowthCycleNoteSchema.safeParse(base).success).toBe(true);
  });

  it('growthStage が null でも受理', () => {
    expect(GrowthCycleNoteSchema.safeParse({ ...base, growthStage: null }).success).toBe(true);
  });

  it('nullable フィールドが null でも受理', () => {
    const input = { ...base, stageNote: null, note: null };
    expect(GrowthCycleNoteSchema.safeParse(input).success).toBe(true);
  });

  it('isLongTermSuitable が false でも受理', () => {
    expect(GrowthCycleNoteSchema.safeParse({ ...base, isLongTermSuitable: false }).success).toBe(
      true,
    );
  });

  it('id が空文字を拒否', () => {
    expect(GrowthCycleNoteSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('jobTargetId が空文字を拒否', () => {
    expect(GrowthCycleNoteSchema.safeParse({ ...base, jobTargetId: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = base;
    expect(GrowthCycleNoteSchema.safeParse(withoutId).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = base;
    expect(GrowthCycleNoteSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });

  it('isLongTermSuitable に非 boolean を拒否', () => {
    expect(GrowthCycleNoteSchema.safeParse({ ...base, isLongTermSuitable: 'true' }).success).toBe(
      false,
    );
  });
});

describe('GrowthCycleNoteCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(GrowthCycleNoteCreateSchema.safeParse(input).success).toBe(true);
  });

  it('入力に createdAt を含めても strip される', () => {
    const result = GrowthCycleNoteCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('createdAt');
      expect(result.data).not.toHaveProperty('updatedAt');
    }
  });

  it('jobTargetId が必須', () => {
    const { createdAt: _c, updatedAt: _u, jobTargetId: _jt, ...withoutJobTarget } = base;
    expect(GrowthCycleNoteCreateSchema.safeParse(withoutJobTarget).success).toBe(false);
  });
});

describe('GrowthCycleNoteUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(GrowthCycleNoteUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('growthStage のみ更新できる', () => {
    expect(GrowthCycleNoteUpdateSchema.safeParse({ growthStage: 'growth' }).success).toBe(true);
  });

  it('growthStage を null に更新できる', () => {
    expect(GrowthCycleNoteUpdateSchema.safeParse({ growthStage: null }).success).toBe(true);
  });

  it('isLongTermSuitable を更新できる', () => {
    expect(GrowthCycleNoteUpdateSchema.safeParse({ isLongTermSuitable: false }).success).toBe(true);
  });

  it('note を更新できる', () => {
    expect(GrowthCycleNoteUpdateSchema.safeParse({ note: '再確認が必要' }).success).toBe(true);
  });

  it('id を含めても strip される', () => {
    const result = GrowthCycleNoteUpdateSchema.safeParse({ id: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });

  it('jobTargetId を含めても strip される', () => {
    const result = GrowthCycleNoteUpdateSchema.safeParse({ jobTargetId: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('jobTargetId');
    }
  });
});
