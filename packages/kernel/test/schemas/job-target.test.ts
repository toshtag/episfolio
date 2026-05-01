import { describe, expect, it } from 'vitest';
import {
  JobTargetSchema,
  JobTargetStatusSchema,
  JobTargetUpdateSchema,
  SkillItemSchema,
} from '../../src/schemas/job-target.js';

const baseTarget = {
  id: '01HJOB',
  companyName: '株式会社サンプル',
  jobTitle: 'バックエンドエンジニア',
  jobDescription: 'Go/Rust でマイクロサービス開発',
  status: 'researching' as const,
  requiredSkills: [{ id: '01HSKL1', text: 'Go 言語 3 年以上' }],
  preferredSkills: [{ id: '01HSKL2', text: 'Kubernetes 経験' }],
  concerns: 'フルリモート可否',
  appealPoints: 'OSS 貢献実績',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
};

describe('JobTargetStatusSchema', () => {
  it.each([
    'researching',
    'applying',
    'interviewing',
    'offered',
    'rejected',
    'withdrawn',
  ])('%s を受理', (status) => {
    expect(JobTargetStatusSchema.safeParse(status).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(JobTargetStatusSchema.safeParse('archived').success).toBe(false);
    expect(JobTargetStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('SkillItemSchema', () => {
  it('id/text ともに存在する場合を受理', () => {
    expect(SkillItemSchema.safeParse({ id: '01HSKL1', text: 'Go' }).success).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(SkillItemSchema.safeParse({ id: '', text: 'Go' }).success).toBe(false);
  });

  it('text 空文字を拒否', () => {
    expect(SkillItemSchema.safeParse({ id: '01HSKL1', text: '' }).success).toBe(false);
  });
});

describe('JobTargetSchema', () => {
  it('正常系', () => {
    expect(JobTargetSchema.safeParse(baseTarget).success).toBe(true);
  });

  it('companyName 空文字を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, companyName: '' }).success).toBe(false);
  });

  it('jobTitle 空文字を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, jobTitle: '' }).success).toBe(false);
  });

  it('jobDescription 空文字は許可', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, jobDescription: '' }).success).toBe(true);
  });

  it('concerns / appealPoints 空文字は許可', () => {
    expect(
      JobTargetSchema.safeParse({ ...baseTarget, concerns: '', appealPoints: '' }).success,
    ).toBe(true);
  });

  it('未知の status を拒否', () => {
    expect(
      JobTargetSchema.safeParse({ ...baseTarget, status: 'archived' as 'researching' }).success,
    ).toBe(false);
  });

  it('requiredSkills は空配列も許可', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, requiredSkills: [] }).success).toBe(true);
  });

  it('preferredSkills は空配列も許可', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, preferredSkills: [] }).success).toBe(true);
  });

  it('requiredSkills の各要素が SkillItem 形式でない場合を拒否', () => {
    expect(
      JobTargetSchema.safeParse({
        ...baseTarget,
        requiredSkills: [{ id: '', text: 'Go' }],
      }).success,
    ).toBe(false);
  });
});

describe('JobTargetUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(JobTargetUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(JobTargetUpdateSchema.safeParse({ status: 'applying' }).success).toBe(true);
    expect(
      JobTargetUpdateSchema.safeParse({
        requiredSkills: [{ id: '01HSKL1', text: 'TypeScript' }],
      }).success,
    ).toBe(true);
  });

  it('未知の status を拒否', () => {
    expect(JobTargetUpdateSchema.safeParse({ status: 'unknown' as 'researching' }).success).toBe(
      false,
    );
  });
});
