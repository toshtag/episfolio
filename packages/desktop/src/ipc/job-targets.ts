import type { JobTarget, JobTargetUpdate, SkillItem } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

export type CreateJobTargetArgs = {
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  status?: JobTarget['status'];
  requiredSkills?: SkillItem[];
  preferredSkills?: SkillItem[];
  concerns?: string;
  appealPoints?: string;
};

export async function createJobTarget(args: CreateJobTargetArgs): Promise<JobTarget> {
  return invoke<JobTarget>('create_job_target', { args });
}

export async function listJobTargets(): Promise<JobTarget[]> {
  return invoke<JobTarget[]>('list_job_targets');
}

export async function getJobTarget(id: string): Promise<JobTarget | null> {
  return invoke<JobTarget | null>('get_job_target', { id });
}

export async function updateJobTarget(
  id: string,
  patch: JobTargetUpdate,
): Promise<JobTarget> {
  return invoke<JobTarget>('update_job_target', { id, patch });
}

export async function deleteJobTarget(id: string): Promise<void> {
  return invoke<void>('delete_job_target', { id });
}
