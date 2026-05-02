import type { ApplicationMotive, ApplicationMotiveUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type CreateApplicationMotiveArgs = {
  jobTargetId: string;
  companyFuture?: string;
  contributionAction?: string;
  leveragedExperience?: string;
  formattedText?: string;
};

export async function createApplicationMotive(
  args: CreateApplicationMotiveArgs,
): Promise<ApplicationMotive> {
  return invoke<ApplicationMotive>('create_application_motive', { args });
}

export async function listApplicationMotives(): Promise<ApplicationMotive[]> {
  return invoke<ApplicationMotive[]>('list_application_motives');
}

export async function listApplicationMotivesByJobTarget(
  jobTargetId: string,
): Promise<ApplicationMotive[]> {
  return invoke<ApplicationMotive[]>('list_application_motives_by_job_target', { jobTargetId });
}

export async function getApplicationMotive(id: string): Promise<ApplicationMotive | null> {
  return invoke<ApplicationMotive | null>('get_application_motive', { id });
}

export async function updateApplicationMotive(
  id: string,
  patch: ApplicationMotiveUpdate,
): Promise<ApplicationMotive> {
  return invoke<ApplicationMotive>('update_application_motive', { id, patch });
}

export async function deleteApplicationMotive(id: string): Promise<void> {
  return invoke<void>('delete_application_motive', { id });
}
