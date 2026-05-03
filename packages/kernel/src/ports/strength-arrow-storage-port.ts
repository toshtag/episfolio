import type { StrengthArrow, StrengthArrowType } from '../domain/strength-arrow.js';
import type { StrengthArrowUpdate } from '../schemas/strength-arrow.js';

export interface StrengthArrowStoragePort {
  create(arrow: StrengthArrow): Promise<StrengthArrow>;
  list(): Promise<StrengthArrow[]>;
  listByType(type: StrengthArrowType): Promise<StrengthArrow[]>;
  get(id: string): Promise<StrengthArrow | null>;
  update(id: string, patch: StrengthArrowUpdate): Promise<StrengthArrow>;
  delete(id: string): Promise<void>;
}
