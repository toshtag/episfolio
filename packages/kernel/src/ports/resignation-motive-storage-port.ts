import type { ResignationMotive } from '../domain/resignation-motive.js';
import type { ResignationMotiveUpdate } from '../schemas/resignation-motive.js';

export interface ResignationMotiveStoragePort {
  save(motive: ResignationMotive): Promise<ResignationMotive>;
  list(): Promise<ResignationMotive[]>;
  get(id: string): Promise<ResignationMotive | null>;
  update(id: string, patch: ResignationMotiveUpdate): Promise<ResignationMotive>;
  delete(id: string): Promise<void>;
}
