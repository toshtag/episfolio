import { describe, expect, it } from 'vitest';
import {
  CareerDocumentSchema,
  CareerDocumentStatusSchema,
  CareerDocumentTypeSchema,
  CareerDocumentUpdateSchema,
  DocumentRevisionSchema,
} from '../../src/schemas/career-document.js';

const baseDoc = {
  id: '01HDOC',
  title: 'バックエンドエンジニア 職務経歴書',
  jobTarget: '',
  documentType: 'free_form' as const,
  jobTargetId: null,
  status: 'draft' as const,
  createdAt: '2026-04-30T00:00:00Z',
  updatedAt: '2026-04-30T00:00:00Z',
};

const baseRevision = {
  id: '01HREV',
  documentId: '01HDOC',
  content: '# 職務経歴書\n\n本文',
  sourceEvidenceIds: [],
  sourceAIRunId: null,
  createdBy: 'human' as const,
  revisionReason: '初版',
  targetMemo: '',
  previousRevisionId: null,
  createdAt: '2026-04-30T00:00:00Z',
};

describe('CareerDocumentTypeSchema', () => {
  it.each(['free_form', 'jibun_taizen', 'career_digest'])('%s を受理', (t) => {
    expect(CareerDocumentTypeSchema.safeParse(t).success).toBe(true);
  });

  it('未知の type を拒否', () => {
    expect(CareerDocumentTypeSchema.safeParse('custom').success).toBe(false);
  });
});

describe('CareerDocumentStatusSchema', () => {
  it('draft/finalized を受理', () => {
    expect(CareerDocumentStatusSchema.safeParse('draft').success).toBe(true);
    expect(CareerDocumentStatusSchema.safeParse('finalized').success).toBe(true);
  });

  it('archived 等を拒否', () => {
    expect(CareerDocumentStatusSchema.safeParse('archived').success).toBe(false);
  });
});

describe('CareerDocumentSchema', () => {
  it('正常系', () => {
    expect(CareerDocumentSchema.safeParse(baseDoc).success).toBe(true);
  });

  it('title 空文字を拒否', () => {
    expect(CareerDocumentSchema.safeParse({ ...baseDoc, title: '' }).success).toBe(false);
  });

  it('jobTarget 空文字は許可（任意フィールド）', () => {
    expect(CareerDocumentSchema.safeParse({ ...baseDoc, jobTarget: '' }).success).toBe(true);
  });

  it('documentType 省略時は free_form にデフォルト', () => {
    const { documentType: _, ...withoutType } = baseDoc;
    const result = CareerDocumentSchema.safeParse(withoutType);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.documentType).toBe('free_form');
  });

  it('documentType に有効な値を受理', () => {
    expect(
      CareerDocumentSchema.safeParse({ ...baseDoc, documentType: 'career_digest' }).success,
    ).toBe(true);
  });

  it('未知の documentType を拒否', () => {
    expect(
      CareerDocumentSchema.safeParse({ ...baseDoc, documentType: 'custom' as 'free_form' }).success,
    ).toBe(false);
  });

  it('jobTargetId null は許可', () => {
    expect(CareerDocumentSchema.safeParse({ ...baseDoc, jobTargetId: null }).success).toBe(true);
  });

  it('jobTargetId に ULID 文字列は許可', () => {
    expect(CareerDocumentSchema.safeParse({ ...baseDoc, jobTargetId: '01HJOB1' }).success).toBe(
      true,
    );
  });

  it('jobTargetId 省略時は null にデフォルト', () => {
    const { jobTargetId: _, ...withoutId } = baseDoc;
    const result = CareerDocumentSchema.safeParse(withoutId);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.jobTargetId).toBeNull();
  });

  it('未知の status を拒否', () => {
    expect(
      CareerDocumentSchema.safeParse({ ...baseDoc, status: 'archived' as 'draft' }).success,
    ).toBe(false);
  });
});

describe('CareerDocumentUpdateSchema', () => {
  it('partial: 一部だけ送れる', () => {
    expect(CareerDocumentUpdateSchema.safeParse({}).success).toBe(true);
    expect(CareerDocumentUpdateSchema.safeParse({ title: '更新' }).success).toBe(true);
  });

  it('documentType の更新が可能', () => {
    expect(CareerDocumentUpdateSchema.safeParse({ documentType: 'career_digest' }).success).toBe(
      true,
    );
  });

  it('jobTargetId null で更新可能', () => {
    expect(CareerDocumentUpdateSchema.safeParse({ jobTargetId: null }).success).toBe(true);
  });

  it('jobTargetId に ULID で更新可能', () => {
    expect(CareerDocumentUpdateSchema.safeParse({ jobTargetId: '01HJOB1' }).success).toBe(true);
  });
});

describe('DocumentRevisionSchema', () => {
  it('正常系', () => {
    expect(DocumentRevisionSchema.safeParse(baseRevision).success).toBe(true);
  });

  it('revisionReason 必須（空文字拒否）', () => {
    expect(DocumentRevisionSchema.safeParse({ ...baseRevision, revisionReason: '' }).success).toBe(
      false,
    );
  });

  it('targetMemo は空文字許可', () => {
    expect(DocumentRevisionSchema.safeParse({ ...baseRevision, targetMemo: '' }).success).toBe(
      true,
    );
  });

  it('previousRevisionId は null 許可、文字列も許可', () => {
    expect(
      DocumentRevisionSchema.safeParse({ ...baseRevision, previousRevisionId: null }).success,
    ).toBe(true);
    expect(
      DocumentRevisionSchema.safeParse({ ...baseRevision, previousRevisionId: '01HPREV' }).success,
    ).toBe(true);
  });

  it('createdBy human/ai 以外を拒否', () => {
    expect(
      DocumentRevisionSchema.safeParse({ ...baseRevision, createdBy: 'system' as 'human' }).success,
    ).toBe(false);
  });

  it('sourceEvidenceIds は配列必須', () => {
    expect(
      DocumentRevisionSchema.safeParse({
        ...baseRevision,
        sourceEvidenceIds: 'ev1' as unknown as string[],
      }).success,
    ).toBe(false);
  });

  it('jobTargetId null を受理', () => {
    const parsed = DocumentRevisionSchema.parse({ ...baseRevision, jobTargetId: null });
    expect(parsed.jobTargetId).toBeNull();
  });

  it('jobTargetId に ULID 文字列を受理', () => {
    const parsed = DocumentRevisionSchema.parse({ ...baseRevision, jobTargetId: '01HJOB1' });
    expect(parsed.jobTargetId).toBe('01HJOB1');
  });

  it('jobTargetId 省略時は null にデフォルト（後方互換: 既存 row が jobTargetId カラムを持たない）', () => {
    const parsed = DocumentRevisionSchema.parse(baseRevision);
    expect(parsed.jobTargetId).toBeNull();
  });

  it('jobTargetId に数値など不正型を拒否', () => {
    expect(
      DocumentRevisionSchema.safeParse({
        ...baseRevision,
        jobTargetId: 123 as unknown as string,
      }).success,
    ).toBe(false);
  });
});
