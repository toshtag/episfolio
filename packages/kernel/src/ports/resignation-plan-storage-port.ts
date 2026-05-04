import type { ResignationPlan } from '../domain/resignation-plan.js';
import type { ResignationPlanUpdate } from '../schemas/resignation-plan.js';

export interface ResignationPlanStoragePort {
  create(plan: ResignationPlan): Promise<ResignationPlan>;
  listByJobTarget(jobTargetId: string): Promise<ResignationPlan[]>;
  get(id: string): Promise<ResignationPlan | null>;
  update(id: string, patch: ResignationPlanUpdate): Promise<ResignationPlan>;
  delete(id: string): Promise<void>;
}
