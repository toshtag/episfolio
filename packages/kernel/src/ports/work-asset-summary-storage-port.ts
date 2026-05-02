import type { WorkAssetSummary } from '../domain/work-asset-summary.js';
import type { WorkAssetSummaryUpdate } from '../schemas/work-asset-summary.js';

export interface WorkAssetSummaryStoragePort {
  create(asset: WorkAssetSummary): Promise<WorkAssetSummary>;
  list(): Promise<WorkAssetSummary[]>;
  get(id: string): Promise<WorkAssetSummary | null>;
  update(id: string, patch: WorkAssetSummaryUpdate): Promise<WorkAssetSummary>;
  delete(id: string): Promise<void>;
}
