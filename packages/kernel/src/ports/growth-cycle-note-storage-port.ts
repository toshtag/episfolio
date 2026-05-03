import type { GrowthCycleNote } from '../domain/growth-cycle-note.js';
import type { GrowthCycleNoteUpdate } from '../schemas/growth-cycle-note.js';

export interface GrowthCycleNoteStoragePort {
  create(record: GrowthCycleNote): Promise<GrowthCycleNote>;
  listByJobTarget(jobTargetId: string): Promise<GrowthCycleNote[]>;
  get(id: string): Promise<GrowthCycleNote | null>;
  update(id: string, patch: GrowthCycleNoteUpdate): Promise<GrowthCycleNote>;
  delete(id: string): Promise<void>;
}
