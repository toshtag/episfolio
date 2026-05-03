import { describe, expect, it } from 'vitest';
import {
  MicrochopSkillCreateSchema,
  MicrochopSkillSchema,
  MicrochopSkillUpdateSchema,
  MicrochopTaskSchema,
} from '../../src/schemas/microchop-skill.js';

const baseTask = { id: '01MCT0001', label: '企業の調査', transferable: true };

const base = {
  id: '01MCS0001',
  jobTitle: '営業担当',
  industry: '製造業',
  tasks: [baseTask],
  transferableSkills: 'ヒアリング力、資料作成力',
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
};

describe('MicrochopTaskSchema', () => {
  it('transferable: true を受理', () => {
    expect(MicrochopTaskSchema.safeParse({ ...baseTask, transferable: true }).success).toBe(true);
  });

  it('transferable: false を受理', () => {
    expect(MicrochopTaskSchema.safeParse({ ...baseTask, transferable: false }).success).toBe(true);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = baseTask;
    expect(MicrochopTaskSchema.safeParse(withoutId).success).toBe(false);
  });

  it('id 空文字を拒否', () => {
    expect(MicrochopTaskSchema.safeParse({ ...baseTask, id: '' }).success).toBe(false);
  });

  it('transferable が boolean でない場合を拒否', () => {
    expect(MicrochopTaskSchema.safeParse({ ...baseTask, transferable: 'true' }).success).toBe(
      false,
    );
  });
});

describe('MicrochopSkillSchema', () => {
  it('正常系（全フィールドあり）', () => {
    expect(MicrochopSkillSchema.safeParse(base).success).toBe(true);
  });

  it('note が null でも受理', () => {
    expect(MicrochopSkillSchema.safeParse({ ...base, note: null }).success).toBe(true);
  });

  it('note が文字列でも受理', () => {
    expect(MicrochopSkillSchema.safeParse({ ...base, note: 'メモ' }).success).toBe(true);
  });

  it('tasks が空配列でも受理', () => {
    expect(MicrochopSkillSchema.safeParse({ ...base, tasks: [] }).success).toBe(true);
  });

  it('jobTitle が空文字でも受理', () => {
    expect(MicrochopSkillSchema.safeParse({ ...base, jobTitle: '' }).success).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(MicrochopSkillSchema.safeParse({ ...base, id: '' }).success).toBe(false);
  });

  it('id 欠如を拒否', () => {
    const { id: _omit, ...withoutId } = base;
    expect(MicrochopSkillSchema.safeParse(withoutId).success).toBe(false);
  });

  it('tasks 内に不正なタスクがあれば拒否', () => {
    const badTask = { id: '', label: 'bad', transferable: true };
    expect(MicrochopSkillSchema.safeParse({ ...base, tasks: [badTask] }).success).toBe(false);
  });

  it('createdAt 欠如を拒否', () => {
    const { createdAt: _omit, ...withoutCreatedAt } = base;
    expect(MicrochopSkillSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });
});

describe('MicrochopSkillCreateSchema', () => {
  it('createdAt / updatedAt を含まずに受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(MicrochopSkillCreateSchema.safeParse(input).success).toBe(true);
  });

  it('tasks が空配列でも create を受理', () => {
    const { createdAt: _c, updatedAt: _u, ...input } = base;
    expect(MicrochopSkillCreateSchema.safeParse({ ...input, tasks: [] }).success).toBe(true);
  });

  it('入力に createdAt を含めても strip される', () => {
    const result = MicrochopSkillCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('createdAt');
      expect(result.data).not.toHaveProperty('updatedAt');
    }
  });
});

describe('MicrochopSkillUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(MicrochopSkillUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('jobTitle のみ更新できる', () => {
    expect(MicrochopSkillUpdateSchema.safeParse({ jobTitle: '新職種' }).success).toBe(true);
  });

  it('tasks を更新できる', () => {
    const newTasks = [{ id: '01MCT0099', label: '新タスク', transferable: false }];
    expect(MicrochopSkillUpdateSchema.safeParse({ tasks: newTasks }).success).toBe(true);
  });

  it('note を null に更新できる', () => {
    expect(MicrochopSkillUpdateSchema.safeParse({ note: null }).success).toBe(true);
  });

  it('id を含めても strip される', () => {
    const result = MicrochopSkillUpdateSchema.safeParse({ id: 'should-be-stripped' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });
});
