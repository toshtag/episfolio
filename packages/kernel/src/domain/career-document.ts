import type { ISO8601, ULID } from './episode.js';

export type CareerDocumentStatus = 'draft' | 'finalized';

export type CareerDocument = {
  id: ULID;
  title: string;
  jobTarget: string;
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
  previousRevisionId: ULID | null;
  createdAt: ISO8601;
};
