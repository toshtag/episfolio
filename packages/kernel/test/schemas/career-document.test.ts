import { describe, expect, it } from 'vitest';
import {
  CareerDocumentSchema,
  CareerDocumentStatusSchema,
  CareerDocumentUpdateSchema,
  DocumentRevisionSchema,
} from '../../src/schemas/career-document.js';

const baseDoc = {
  id: '01HDOC',
  title: 'バックエンドエンジニア 職務経歴書',
  jobTarget: '',
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
});
