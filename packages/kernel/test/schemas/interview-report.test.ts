import { describe, expect, it } from 'vitest';
import {
  InterviewerStyleSchema,
  InterviewReportSchema,
  InterviewReportUpdateSchema,
  InterviewStageSchema,
  ResponseImpressionSchema,
} from '../../src/schemas/interview-report.js';

const baseReport = {
  id: '01HIRPT1',
  jobTargetId: '01HJOB1',
  stage: 'first' as const,
  interviewerNote: '人事: 田中氏',
  qaNote: '志望動機を聞かれた',
  motivationChangeNote: '変わらず高い',
  questionsToBringNote: '技術スタックについて聞きたい',
  conductedAt: '2026-05-02T10:00:00Z',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
};

describe('InterviewStageSchema', () => {
  it.each(['first', 'second', 'final', 'other'])('%s を受理', (stage) => {
    expect(InterviewStageSchema.safeParse(stage).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(InterviewStageSchema.safeParse('third').success).toBe(false);
    expect(InterviewStageSchema.safeParse('').success).toBe(false);
  });
});

describe('InterviewReportSchema', () => {
  it('正常系', () => {
    expect(InterviewReportSchema.safeParse(baseReport).success).toBe(true);
  });

  it('conductedAt が null でも受理', () => {
    expect(InterviewReportSchema.safeParse({ ...baseReport, conductedAt: null }).success).toBe(
      true,
    );
  });

  it('id 空文字を拒否', () => {
    expect(InterviewReportSchema.safeParse({ ...baseReport, id: '' }).success).toBe(false);
  });

  it('jobTargetId 空文字を拒否', () => {
    expect(InterviewReportSchema.safeParse({ ...baseReport, jobTargetId: '' }).success).toBe(false);
  });

  it('未知の stage を拒否', () => {
    expect(
      InterviewReportSchema.safeParse({ ...baseReport, stage: 'third' as 'first' }).success,
    ).toBe(false);
  });

  it('各 note フィールドは空文字を許可', () => {
    expect(
      InterviewReportSchema.safeParse({
        ...baseReport,
        interviewerNote: '',
        qaNote: '',
        motivationChangeNote: '',
        questionsToBringNote: '',
      }).success,
    ).toBe(true);
  });

  it('conductedAt 空文字を拒否（null か非空文字のみ）', () => {
    expect(InterviewReportSchema.safeParse({ ...baseReport, conductedAt: '' }).success).toBe(false);
  });
});

describe('InterviewerStyleSchema', () => {
  it.each(['numeric', 'process', 'unknown'])('%s を受理', (style) => {
    expect(InterviewerStyleSchema.safeParse(style).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(InterviewerStyleSchema.safeParse('quantitative').success).toBe(false);
  });
});

describe('ResponseImpressionSchema', () => {
  it.each(['good', 'neutral', 'poor'])('%s を受理', (imp) => {
    expect(ResponseImpressionSchema.safeParse(imp).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(ResponseImpressionSchema.safeParse('excellent').success).toBe(false);
  });
});

describe('InterviewReportSchema — 書籍 B 第4章フィールド', () => {
  it('新フィールドが省略されていても default null で受理', () => {
    const result = InterviewReportSchema.safeParse(baseReport);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interviewerRole).toBeNull();
      expect(result.data.interviewerStyle).toBeNull();
      expect(result.data.talkRatioSelf).toBeNull();
      expect(result.data.questionsAskedNote).toBeNull();
      expect(result.data.responseImpression).toBeNull();
      expect(result.data.blankAreasNote).toBeNull();
      expect(result.data.improvementNote).toBeNull();
      expect(result.data.passed).toBeNull();
    }
  });

  it('全新フィールドを明示指定して受理', () => {
    const input = {
      ...baseReport,
      interviewerRole: '現場管理職',
      interviewerStyle: 'numeric',
      talkRatioSelf: 60,
      questionsAskedNote: '志望動機・強み',
      responseImpression: 'good',
      blankAreasNote: '詳細プロセスは誘導済み',
      improvementNote: '数字をもっと具体的に',
      passed: true,
    };
    expect(InterviewReportSchema.safeParse(input).success).toBe(true);
  });

  it('talkRatioSelf が 0〜100 範囲外を拒否', () => {
    expect(InterviewReportSchema.safeParse({ ...baseReport, talkRatioSelf: 101 }).success).toBe(
      false,
    );
    expect(InterviewReportSchema.safeParse({ ...baseReport, talkRatioSelf: -1 }).success).toBe(
      false,
    );
  });

  it('未知の interviewerStyle を拒否', () => {
    expect(
      InterviewReportSchema.safeParse({ ...baseReport, interviewerStyle: 'quantitative' }).success,
    ).toBe(false);
  });

  it('未知の responseImpression を拒否', () => {
    expect(
      InterviewReportSchema.safeParse({ ...baseReport, responseImpression: 'excellent' }).success,
    ).toBe(false);
  });
});

describe('InterviewReportUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(InterviewReportUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(
      InterviewReportUpdateSchema.safeParse({ stage: 'second', qaNote: '追加質問あり' }).success,
    ).toBe(true);
  });

  it('conductedAt を null で更新できる', () => {
    expect(InterviewReportUpdateSchema.safeParse({ conductedAt: null }).success).toBe(true);
  });

  it('未知の stage を拒否', () => {
    expect(InterviewReportUpdateSchema.safeParse({ stage: 'unknown' as 'first' }).success).toBe(
      false,
    );
  });

  it('新フィールドを patch で更新できる', () => {
    expect(
      InterviewReportUpdateSchema.safeParse({
        interviewerStyle: 'process',
        responseImpression: 'neutral',
        passed: false,
        talkRatioSelf: 55,
      }).success,
    ).toBe(true);
  });

  it('passed を null で更新できる', () => {
    expect(InterviewReportUpdateSchema.safeParse({ passed: null }).success).toBe(true);
  });
});
