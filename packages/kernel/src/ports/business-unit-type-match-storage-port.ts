import type { BusinessUnitTypeMatch } from '../domain/business-unit-type-match.js';
import type { BusinessUnitTypeMatchUpdate } from '../schemas/business-unit-type-match.js';

export interface BusinessUnitTypeMatchStoragePort {
  create(record: BusinessUnitTypeMatch): Promise<BusinessUnitTypeMatch>;
  listByJobTarget(jobTargetId: string): Promise<BusinessUnitTypeMatch[]>;
  get(id: string): Promise<BusinessUnitTypeMatch | null>;
  update(id: string, patch: BusinessUnitTypeMatchUpdate): Promise<BusinessUnitTypeMatch>;
  delete(id: string): Promise<void>;
}
