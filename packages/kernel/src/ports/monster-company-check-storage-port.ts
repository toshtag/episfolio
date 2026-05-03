import type { MonsterCompanyCheck } from '../domain/monster-company-check.js';
import type { MonsterCompanyCheckUpdate } from '../schemas/monster-company-check.js';

export interface MonsterCompanyCheckStoragePort {
  create(record: MonsterCompanyCheck): Promise<MonsterCompanyCheck>;
  listByJobTarget(jobTargetId: string): Promise<MonsterCompanyCheck[]>;
  get(id: string): Promise<MonsterCompanyCheck | null>;
  update(id: string, patch: MonsterCompanyCheckUpdate): Promise<MonsterCompanyCheck>;
  delete(id: string): Promise<void>;
}
