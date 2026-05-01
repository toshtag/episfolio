import { describe, expect, it } from 'vitest';
import {
  JobRequirementMappingSchema,
  JobRequirementMappingUpdateSchema,
} from '../../src/schemas/job-requirement-mapping.js';

const valid = {
  id: '01HJM1',
  jobTargetId: '01HJOB1',
  requirementSkillId: '01HSKL1',
  episodeIds: ['01HEP1', '01HEP2'],
  userNote: '前職での実装経験',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
};

describe('JobRequirementMappingSchema', () => {
  it('有効な値を受理する', () => {
    expect(() => JobRequirementMappingSchema.parse(valid)).not.toThrow();
  });

  it('episodeIds は空配列を受理する（紐付け前の状態）', () => {
    expect(() => JobRequirementMappingSchema.parse({ ...valid, episodeIds: [] })).not.toThrow();
  });

  it('userNote は空文字列を受理する', () => {
    expect(() => JobRequirementMappingSchema.parse({ ...valid, userNote: '' })).not.toThrow();
  });

  it('id が空文字列だと拒否', () => {
    expect(() => JobRequirementMappingSchema.parse({ ...valid, id: '' })).toThrow();
  });

  it('jobTargetId が空文字列だと拒否', () => {
    expect(() => JobRequirementMappingSchema.parse({ ...valid, jobTargetId: '' })).toThrow();
  });

  it('requirementSkillId が空文字列だと拒否', () => {
    expect(() =>
      JobRequirementMappingSchema.parse({ ...valid, requirementSkillId: '' }),
    ).toThrow();
  });

  it('episodeIds に空文字列が混ざると拒否', () => {
    expect(() =>
      JobRequirementMappingSchema.parse({ ...valid, episodeIds: ['01HEP1', ''] }),
    ).toThrow();
  });

  it('createdAt が空文字列だと拒否', () => {
    expect(() => JobRequirementMappingSchema.parse({ ...valid, createdAt: '' })).toThrow();
  });
});

describe('JobRequirementMappingUpdateSchema', () => {
  it('episodeIds のみの partial を受理', () => {
    expect(() =>
      JobRequirementMappingUpdateSchema.parse({ episodeIds: ['01HEP1'] }),
    ).not.toThrow();
  });

  it('userNote のみの partial を受理', () => {
    expect(() => JobRequirementMappingUpdateSchema.parse({ userNote: 'メモ' })).not.toThrow();
  });

  it('空オブジェクトを受理（変更なし）', () => {
    expect(() => JobRequirementMappingUpdateSchema.parse({})).not.toThrow();
  });

  it('id を patch には含められない（不可変フィールド）', () => {
    const parsed = JobRequirementMappingUpdateSchema.parse({
      // biome-ignore lint/suspicious/noExplicitAny: 意図的に不正キーを渡す
      id: 'X',
      userNote: 'メモ',
    } as any);
    expect('id' in parsed).toBe(false);
  });
});
