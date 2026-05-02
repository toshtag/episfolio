import type { ApplicationMotive } from '../domain/application-motive.js';
import type { ApplicationMotiveUpdate } from '../schemas/application-motive.js';

export interface ApplicationMotiveStoragePort {
  save(motive: ApplicationMotive): Promise<ApplicationMotive>;
  list(): Promise<ApplicationMotive[]>;
  listByJobTarget(jobTargetId: string): Promise<ApplicationMotive[]>;
  get(id: string): Promise<ApplicationMotive | null>;
  update(id: string, patch: ApplicationMotiveUpdate): Promise<ApplicationMotive>;
  delete(id: string): Promise<void>;
}
