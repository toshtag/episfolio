import type { WeakConnection } from '../domain/weak-connection.js';
import type { WeakConnectionUpdate } from '../schemas/weak-connection.js';

export interface WeakConnectionStoragePort {
  create(record: WeakConnection): Promise<WeakConnection>;
  list(): Promise<WeakConnection[]>;
  get(id: string): Promise<WeakConnection | null>;
  update(id: string, patch: WeakConnectionUpdate): Promise<WeakConnection>;
  delete(id: string): Promise<void>;
}
