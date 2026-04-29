import type { LifeTimelineEntry } from '../domain/life-timeline-entry.js';
import type { LifeTimelineEntryUpdate } from '../schemas/life-timeline-entry.js';

export interface LifeTimelineStoragePort {
  create(entry: LifeTimelineEntry): Promise<LifeTimelineEntry>;
  list(): Promise<LifeTimelineEntry[]>;
  get(id: string): Promise<LifeTimelineEntry | null>;
  update(id: string, patch: LifeTimelineEntryUpdate): Promise<LifeTimelineEntry>;
  delete(id: string): Promise<void>;
}
