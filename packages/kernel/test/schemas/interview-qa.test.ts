import { describe, expect, it } from 'vitest';
import {
  InterviewQACategorySchema,
  InterviewQASchema,
  InterviewQASourceSchema,
  InterviewQAUpdateSchema,
} from '../../src/schemas/interview-qa.js';

const baseQA = {
  id: '01HIQA1',
  jobTargetId: '01HJOB1',
  category: 'motivation' as const,
  questionAsked: '志望動機を教えてください',
  recommendedAnswer: '御社の〇〇に共感し...',
  answerToAvoid: 'お金のためです',
  questionIntent: '企業研究の深さと熱意を測る',
  orderIndex: 0,
  source: 'manual' as const,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('InterviewQACategorySchema', () => {
  it.each(['self-introduction', 'motivation', 'post-hire', 'other'])('%s を受理', (category) => {
    expect(InterviewQACategorySchema.safeParse(category).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(InterviewQACategorySchema.safeParse('experience').success).toBe(false);
    expect(InterviewQACategorySchema.safeParse('').success).toBe(false);
  });
});

describe('InterviewQASourceSchema', () => {
  it.each(['agent-provided', 'manual'])('%s を受理', (source) => {
    expect(InterviewQASourceSchema.safeParse(source).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(InterviewQASourceSchema.safeParse('ai-generated').success).toBe(false);
  });
});

describe('InterviewQASchema', () => {
  it('正常系（nullable フィールドあり）', () => {
    expect(InterviewQASchema.safeParse(baseQA).success).toBe(true);
  });

  it('nullable フィールドが null でも受理', () => {
    expect(
      InterviewQASchema.safeParse({
        ...baseQA,
        recommendedAnswer: null,
        answerToAvoid: null,
        questionIntent: null,
      }).success,
    ).toBe(true);
  });

  it('questionAsked 空文字を拒否', () => {
    expect(InterviewQASchema.safeParse({ ...baseQA, questionAsked: '' }).success).toBe(false);
  });

  it('jobTargetId 空文字を拒否', () => {
    expect(InterviewQASchema.safeParse({ ...baseQA, jobTargetId: '' }).success).toBe(false);
  });

  it('未知の category を拒否', () => {
    expect(
      InterviewQASchema.safeParse({ ...baseQA, category: 'unknown' as 'motivation' }).success,
    ).toBe(false);
  });

  it('未知の source を拒否', () => {
    expect(InterviewQASchema.safeParse({ ...baseQA, source: 'ai' as 'manual' }).success).toBe(
      false,
    );
  });

  it('orderIndex が負の整数を拒否', () => {
    expect(InterviewQASchema.safeParse({ ...baseQA, orderIndex: -1 }).success).toBe(false);
  });

  it('orderIndex が小数を拒否', () => {
    expect(InterviewQASchema.safeParse({ ...baseQA, orderIndex: 0.5 }).success).toBe(false);
  });

  it('orderIndex が 0 を受理', () => {
    expect(InterviewQASchema.safeParse({ ...baseQA, orderIndex: 0 }).success).toBe(true);
  });
});

describe('InterviewQAUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(InterviewQAUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(
      InterviewQAUpdateSchema.safeParse({ category: 'post-hire', orderIndex: 3 }).success,
    ).toBe(true);
  });

  it('recommendedAnswer を null で更新できる', () => {
    expect(InterviewQAUpdateSchema.safeParse({ recommendedAnswer: null }).success).toBe(true);
  });

  it('未知の category を拒否', () => {
    expect(InterviewQAUpdateSchema.safeParse({ category: 'unknown' as 'motivation' }).success).toBe(
      false,
    );
  });
});
