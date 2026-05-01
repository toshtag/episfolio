import { describe, expect, it } from 'vitest';
import {
  SkillEvidenceConfidenceSchema,
  SkillEvidenceSchema,
  SkillEvidenceSourceSchema,
  SkillEvidenceStatusSchema,
  SkillEvidenceUpdateSchema,
} from '../../src/schemas/skill-evidence.js';

const baseEvidence = {
  id: '01HXXXX',
  strengthLabel: '行動力',
  description: '関係者を巻き込んで前進させる',
  evidenceEpisodeIds: ['ep1'],
  reproducibility: '',
  evaluatedContext: '',
  confidence: 'medium' as const,
  status: 'candidate' as const,
  source: 'manual' as const,
  createdBy: 'human' as const,
  sourceAIRunId: null,
  createdAt: '2026-04-30T00:00:00Z',
  updatedAt: '2026-04-30T00:00:00Z',
};

describe('SkillEvidenceConfidenceSchema', () => {
  it('low/medium/high を受理', () => {
    for (const v of ['low', 'medium', 'high']) {
      expect(SkillEvidenceConfidenceSchema.safeParse(v).success).toBe(true);
    }
  });

  it('不明値を拒否', () => {
    expect(SkillEvidenceConfidenceSchema.safeParse('unknown').success).toBe(false);
  });
});

describe('SkillEvidenceStatusSchema', () => {
  it('candidate/accepted/rejected を受理', () => {
    for (const v of ['candidate', 'accepted', 'rejected']) {
      expect(SkillEvidenceStatusSchema.safeParse(v).success).toBe(true);
    }
  });

  it('draft 等を拒否', () => {
    expect(SkillEvidenceStatusSchema.safeParse('draft').success).toBe(false);
  });
});

describe('SkillEvidenceSourceSchema', () => {
  it('manual/ai-generated のみ受理', () => {
    expect(SkillEvidenceSourceSchema.safeParse('manual').success).toBe(true);
    expect(SkillEvidenceSourceSchema.safeParse('ai-generated').success).toBe(true);
    expect(SkillEvidenceSourceSchema.safeParse('imported').success).toBe(false);
  });
});

describe('SkillEvidenceSchema', () => {
  it('正常系', () => {
    expect(SkillEvidenceSchema.safeParse(baseEvidence).success).toBe(true);
  });

  it('strengthLabel 空文字を拒否', () => {
    expect(SkillEvidenceSchema.safeParse({ ...baseEvidence, strengthLabel: '' }).success).toBe(
      false,
    );
  });

  it('description 空文字を拒否', () => {
    expect(SkillEvidenceSchema.safeParse({ ...baseEvidence, description: '' }).success).toBe(false);
  });

  it('createdBy human/ai 以外を拒否', () => {
    expect(
      SkillEvidenceSchema.safeParse({ ...baseEvidence, createdBy: 'system' as 'human' }).success,
    ).toBe(false);
  });

  it('sourceAIRunId null 許可、文字列も許可', () => {
    expect(SkillEvidenceSchema.safeParse({ ...baseEvidence, sourceAIRunId: null }).success).toBe(
      true,
    );
    expect(SkillEvidenceSchema.safeParse({ ...baseEvidence, sourceAIRunId: 'run1' }).success).toBe(
      true,
    );
  });

  it('evidenceEpisodeIds が配列でない値を拒否', () => {
    expect(
      SkillEvidenceSchema.safeParse({
        ...baseEvidence,
        evidenceEpisodeIds: 'ep1' as unknown as string[],
      }).success,
    ).toBe(false);
  });
});

describe('SkillEvidenceUpdateSchema', () => {
  it('partial: 一部だけ送れる', () => {
    expect(SkillEvidenceUpdateSchema.safeParse({}).success).toBe(true);
    expect(SkillEvidenceUpdateSchema.safeParse({ status: 'accepted' }).success).toBe(true);
  });

  it('partial: 個々の型は守られる', () => {
    expect(SkillEvidenceUpdateSchema.safeParse({ confidence: 'super' }).success).toBe(false);
    expect(SkillEvidenceUpdateSchema.safeParse({ strengthLabel: '' }).success).toBe(false);
  });
});
