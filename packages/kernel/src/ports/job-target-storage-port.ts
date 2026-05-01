import type { JobTarget } from '../domain/job-target.js';
import type { JobTargetUpdate } from '../schemas/job-target.js';

export interface JobTargetStoragePort {
  create(target: JobTarget): Promise<JobTarget>;
  list(): Promise<JobTarget[]>;
  get(id: string): Promise<JobTarget | null>;
  update(id: string, patch: JobTargetUpdate): Promise<JobTarget>;
  delete(id: string): Promise<void>;
}
