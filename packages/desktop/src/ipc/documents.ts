import { invoke } from '@tauri-apps/api/core';

export type CareerDocumentRow = {
  id: string;
  title: string;
  jobTarget: string;
  status: 'draft' | 'finalized';
  createdAt: string;
  updatedAt: string;
};

export type DocumentRevisionRow = {
  id: string;
  documentId: string;
  content: string;
  createdBy: 'human';
  revisionReason: string;
  targetMemo: string;
  jobTargetId: string | null;
  previousRevisionId: string | null;
  createdAt: string;
};

export type GetDocumentResult = {
  document: CareerDocumentRow;
  revisions: DocumentRevisionRow[];
};

export async function listDocuments(): Promise<CareerDocumentRow[]> {
  return invoke<CareerDocumentRow[]>('list_documents');
}

export async function getDocument(documentId: string): Promise<GetDocumentResult> {
  return invoke<GetDocumentResult>('get_document', { args: { documentId } });
}

export type CreateDocumentManualArgs = {
  title: string;
  template: 'resume' | 'skill-summary' | 'blank';
  content: string;
  revisionReason?: string;
  targetMemo?: string;
  jobTargetId?: string;
};

export type CreateDocumentManualResult = {
  document: CareerDocumentRow;
  revision: DocumentRevisionRow;
};

export async function createDocumentManual(
  args: CreateDocumentManualArgs,
): Promise<CreateDocumentManualResult> {
  return invoke<CreateDocumentManualResult>('create_document_manual', { args });
}

export type CreateRevisionManualArgs = {
  documentId: string;
  content: string;
  revisionReason: string;
  targetMemo?: string;
  jobTargetId?: string;
};

export type CreateRevisionManualResult = {
  document: CareerDocumentRow;
  revision: DocumentRevisionRow;
};

export async function createDocumentRevisionManual(
  args: CreateRevisionManualArgs,
): Promise<CreateRevisionManualResult> {
  return invoke<CreateRevisionManualResult>('create_document_revision_manual', { args });
}
