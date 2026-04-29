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
  sourceEvidenceIds: string[];
  sourceAiRunId: string | null;
  createdBy: 'human' | 'ai';
  createdAt: string;
};

export type GenerateDocumentResult = {
  document: CareerDocumentRow;
  revision: DocumentRevisionRow;
};

export type GetDocumentResult = {
  document: CareerDocumentRow;
  revisions: DocumentRevisionRow[];
};

export async function generateDocument(
  evidenceIds: string[],
  jobTarget: string,
  model?: string,
): Promise<GenerateDocumentResult> {
  return invoke<GenerateDocumentResult>('generate_document', {
    args: { evidenceIds, jobTarget, model },
  });
}

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
  sourceEvidenceIds: string[];
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
