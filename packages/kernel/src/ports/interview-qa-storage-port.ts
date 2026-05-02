import type { InterviewQA } from '../domain/interview-qa.js';
import type { InterviewQAUpdate } from '../schemas/interview-qa.js';

export interface InterviewQAStoragePort {
  create(qa: InterviewQA): Promise<InterviewQA>;
  listByJobTarget(jobTargetId: string, sortBy?: 'order' | 'createdAt'): Promise<InterviewQA[]>;
  get(id: string): Promise<InterviewQA | null>;
  update(id: string, patch: InterviewQAUpdate): Promise<InterviewQA>;
  delete(id: string): Promise<void>;
  reorder(jobTargetId: string, idsInOrder: string[]): Promise<void>;
}
