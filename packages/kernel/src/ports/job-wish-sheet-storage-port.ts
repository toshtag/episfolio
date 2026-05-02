import type { JobWishSheet } from '../domain/job-wish-sheet.js';
import type { JobWishSheetUpdate } from '../schemas/job-wish-sheet.js';

export interface JobWishSheetStoragePort {
  save(sheet: JobWishSheet): Promise<JobWishSheet>;
  list(): Promise<JobWishSheet[]>;
  get(id: string): Promise<JobWishSheet | null>;
  update(id: string, patch: JobWishSheetUpdate): Promise<JobWishSheet>;
  delete(id: string): Promise<void>;
}
