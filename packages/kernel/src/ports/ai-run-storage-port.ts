import type { AIRun } from '../domain/ai-run.js';

export interface AIRunStoragePort {
  save(run: AIRun): Promise<AIRun>;
  get(id: string): Promise<AIRun | null>;
  listByPurpose(purpose: string): Promise<AIRun[]>;
}
