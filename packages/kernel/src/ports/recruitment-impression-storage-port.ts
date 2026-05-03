import type { RecruitmentImpression } from '../domain/recruitment-impression.js';
import type { RecruitmentImpressionUpdate } from '../schemas/recruitment-impression.js';

export interface RecruitmentImpressionStoragePort {
  create(record: RecruitmentImpression): Promise<RecruitmentImpression>;
  listByJobTarget(jobTargetId: string): Promise<RecruitmentImpression[]>;
  get(id: string): Promise<RecruitmentImpression | null>;
  update(id: string, patch: RecruitmentImpressionUpdate): Promise<RecruitmentImpression>;
  delete(id: string): Promise<void>;
}
