import type { SubordinateSummary } from '../domain/subordinate-summary.js';
import type { SubordinateSummaryUpdate } from '../schemas/subordinate-summary.js';

export interface SubordinateSummaryStoragePort {
  create(summary: SubordinateSummary): Promise<SubordinateSummary>;
  list(): Promise<SubordinateSummary[]>;
  get(id: string): Promise<SubordinateSummary | null>;
  update(id: string, patch: SubordinateSummaryUpdate): Promise<SubordinateSummary>;
  delete(id: string): Promise<void>;
}
