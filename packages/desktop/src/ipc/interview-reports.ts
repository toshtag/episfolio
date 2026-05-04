import type {
  InterviewReport,
  InterviewReportUpdate,
  InterviewerStyle,
  ResponseImpression,
} from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

export type CreateInterviewReportArgs = {
  jobTargetId: string;
  stage?: InterviewReport['stage'];
  interviewerNote?: string;
  qaNote?: string;
  motivationChangeNote?: string;
  questionsToBringNote?: string;
  conductedAt?: string | null;
  interviewerRole?: string | null;
  interviewerStyle?: InterviewerStyle | null;
  talkRatioSelf?: number | null;
  questionsAskedNote?: string | null;
  responseImpression?: ResponseImpression | null;
  blankAreasNote?: string | null;
  improvementNote?: string | null;
  passed?: boolean | null;
};

export async function createInterviewReport(
  args: CreateInterviewReportArgs,
): Promise<InterviewReport> {
  return invoke<InterviewReport>('create_interview_report', { args });
}

export async function listInterviewReportsByJobTarget(
  jobTargetId: string,
): Promise<InterviewReport[]> {
  return invoke<InterviewReport[]>('list_interview_reports_by_job_target', { jobTargetId });
}

export async function getInterviewReport(id: string): Promise<InterviewReport | null> {
  return invoke<InterviewReport | null>('get_interview_report', { id });
}

export async function updateInterviewReport(
  id: string,
  patch: InterviewReportUpdate,
): Promise<InterviewReport> {
  return invoke<InterviewReport>('update_interview_report', { id, patch });
}

export async function deleteInterviewReport(id: string): Promise<void> {
  return invoke<void>('delete_interview_report', { id });
}
