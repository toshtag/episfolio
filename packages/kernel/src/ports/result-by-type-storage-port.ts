import type { ResultByType } from '../domain/result-by-type.js';
import type { ResultByTypeUpdate } from '../schemas/result-by-type.js';

export interface ResultByTypeStoragePort {
  create(result: ResultByType): Promise<ResultByType>;
  list(): Promise<ResultByType[]>;
  get(id: string): Promise<ResultByType | null>;
  update(id: string, patch: ResultByTypeUpdate): Promise<ResultByType>;
  delete(id: string): Promise<void>;
}
