import type { ULID, ISO8601 } from './episode.js';

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
  createdAt: ISO8601;
};
