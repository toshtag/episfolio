import type { CompanyCertification } from '../domain/company-certification.js';
import type { CompanyCertificationUpdate } from '../schemas/company-certification.js';

export interface CompanyCertificationStoragePort {
  create(record: CompanyCertification): Promise<CompanyCertification>;
  listByJobTarget(jobTargetId: string): Promise<CompanyCertification[]>;
  get(id: string): Promise<CompanyCertification | null>;
  update(id: string, patch: CompanyCertificationUpdate): Promise<CompanyCertification>;
  delete(id: string): Promise<void>;
}
