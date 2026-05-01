import type { JobRequirementMapping } from '../domain/job-requirement-mapping.js';
import type { JobRequirementMappingUpdate } from '../schemas/job-requirement-mapping.js';

export interface JobRequirementMappingStoragePort {
  save(mapping: JobRequirementMapping): Promise<JobRequirementMapping>;
  listByJobTarget(jobTargetId: string): Promise<JobRequirementMapping[]>;
  get(id: string): Promise<JobRequirementMapping | null>;
  update(id: string, patch: JobRequirementMappingUpdate): Promise<JobRequirementMapping>;
  delete(id: string): Promise<void>;
}
