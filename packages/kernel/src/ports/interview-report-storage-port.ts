import type { InterviewReport } from '../domain/interview-report.js';
import type { InterviewReportUpdate } from '../schemas/interview-report.js';

export interface InterviewReportStoragePort {
  create(report: InterviewReport): Promise<InterviewReport>;
  listByJobTarget(jobTargetId: string): Promise<InterviewReport[]>;
  get(id: string): Promise<InterviewReport | null>;
  update(id: string, patch: InterviewReportUpdate): Promise<InterviewReport>;
  delete(id: string): Promise<void>;
}
