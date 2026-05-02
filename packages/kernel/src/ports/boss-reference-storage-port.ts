import type { BossReference } from '../domain/boss-reference.js';
import type { BossReferenceUpdate } from '../schemas/boss-reference.js';

export interface BossReferenceStoragePort {
  create(ref: BossReference): Promise<BossReference>;
  list(): Promise<BossReference[]>;
  get(id: string): Promise<BossReference | null>;
  update(id: string, patch: BossReferenceUpdate): Promise<BossReference>;
  delete(id: string): Promise<void>;
}
