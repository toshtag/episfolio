import type { CareerDocument } from '../domain/career-document.js';
import type { CareerDocumentUpdate } from '../schemas/career-document.js';

export interface CareerDocumentStoragePort {
  save(doc: CareerDocument): Promise<CareerDocument>;
  list(): Promise<CareerDocument[]>;
  get(id: string): Promise<CareerDocument | null>;
  update(id: string, patch: CareerDocumentUpdate): Promise<CareerDocument>;
}
