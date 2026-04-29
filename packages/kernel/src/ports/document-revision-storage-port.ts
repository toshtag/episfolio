import type { DocumentRevision } from '../domain/career-document.js';

export interface DocumentRevisionStoragePort {
  save(revision: DocumentRevision): Promise<DocumentRevision>;
  listByDocument(documentId: string): Promise<DocumentRevision[]>;
  get(id: string): Promise<DocumentRevision | null>;
}
