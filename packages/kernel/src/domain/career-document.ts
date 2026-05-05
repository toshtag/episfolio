import type { ISO8601, ULID } from './types.js';

export type CareerDocumentStatus = 'draft' | 'finalized';

export type CareerDocumentType = 'free_form' | 'jibun_taizen' | 'career_digest';

export type CareerDocument = {
  id: ULID;
  title: string;
  jobTarget: string;
  documentType: CareerDocumentType;
  jobTargetId: ULID | null;
  status: CareerDocumentStatus;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};

export type DocumentRevision = {
  id: ULID;
  documentId: ULID;
  content: string;
  sourceEvidenceIds: ULID[];
  sourceAIRunId: ULID | null;
  createdBy: 'human' | 'ai';
  revisionReason: string;
  targetMemo: string;
  jobTargetId: ULID | null;
  previousRevisionId: ULID | null;
  createdAt: ISO8601;
};
