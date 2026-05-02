import type { InterviewQA, InterviewQAUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

export type CreateInterviewQAArgs = {
  jobTargetId: string;
  category?: InterviewQA['category'];
  questionAsked: string;
  recommendedAnswer?: string | null;
  answerToAvoid?: string | null;
  questionIntent?: string | null;
  orderIndex?: number;
  source?: InterviewQA['source'];
};

export async function createInterviewQA(args: CreateInterviewQAArgs): Promise<InterviewQA> {
  return invoke<InterviewQA>('create_interview_qa', { args });
}

export async function listInterviewQAsByJobTarget(
  jobTargetId: string,
  sortBy?: 'order' | 'createdAt',
): Promise<InterviewQA[]> {
  return invoke<InterviewQA[]>('list_interview_qas_by_job_target', { jobTargetId, sortBy });
}

export async function getInterviewQA(id: string): Promise<InterviewQA | null> {
  return invoke<InterviewQA | null>('get_interview_qa', { id });
}

export async function updateInterviewQA(
  id: string,
  patch: InterviewQAUpdate,
): Promise<InterviewQA> {
  return invoke<InterviewQA>('update_interview_qa', { id, patch });
}

export async function deleteInterviewQA(id: string): Promise<void> {
  return invoke<void>('delete_interview_qa', { id });
}

export async function reorderInterviewQAs(
  jobTargetId: string,
  idsInOrder: string[],
): Promise<void> {
  return invoke<void>('reorder_interview_qas', { args: { jobTargetId, idsInOrder } });
}
