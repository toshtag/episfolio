import type { StrengthFromWeakness } from '../domain/strength-from-weakness.js';
import type { StrengthFromWeaknessUpdate } from '../schemas/strength-from-weakness.js';

export interface StrengthFromWeaknessStoragePort {
  create(record: StrengthFromWeakness): Promise<StrengthFromWeakness>;
  list(): Promise<StrengthFromWeakness[]>;
  get(id: string): Promise<StrengthFromWeakness | null>;
  update(id: string, patch: StrengthFromWeaknessUpdate): Promise<StrengthFromWeakness>;
  delete(id: string): Promise<void>;
}
