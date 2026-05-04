import type { ResignationPlan, ResignationPlanUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

export type CreateResignationPlanArgs = {
  jobTargetId: string;
  annualSalary?: number | null;
  annualHolidays?: number | null;
  dailyWorkingHours?: number | null;
  commuteMinutes?: number | null;
  positionNote?: string;
  recruitmentBackground?: ResignationPlan['recruitmentBackground'];
  riskMemo?: string;
  finalInterviewAt?: string | null;
  offerNotifiedAt?: string | null;
  offerAcceptedAt?: string | null;
  resignationNotifiedAt?: string | null;
  handoverStartedAt?: string | null;
  lastWorkingDayAt?: string | null;
  paidLeaveStartAt?: string | null;
  joinedAt?: string | null;
  availableDateFrom?: string | null;
  availableDateTo?: string | null;
  negotiationNote?: string;
  samuraiLossNote?: string;
  samuraiGainNote?: string;
  nextExitPlan?: string;
};

export async function createResignationPlan(
  args: CreateResignationPlanArgs,
): Promise<ResignationPlan> {
  return invoke<ResignationPlan>('create_resignation_plan', { args });
}

export async function listResignationPlansByJobTarget(
  jobTargetId: string,
): Promise<ResignationPlan[]> {
  return invoke<ResignationPlan[]>('list_resignation_plans_by_job_target', { jobTargetId });
}

export async function getResignationPlan(id: string): Promise<ResignationPlan | null> {
  return invoke<ResignationPlan | null>('get_resignation_plan', { id });
}

export async function updateResignationPlan(
  id: string,
  patch: ResignationPlanUpdate,
): Promise<ResignationPlan> {
  return invoke<ResignationPlan>('update_resignation_plan', { id, patch });
}

export async function deleteResignationPlan(id: string): Promise<void> {
  return invoke<void>('delete_resignation_plan', { id });
}
