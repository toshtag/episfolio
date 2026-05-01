import type { JobRequirementMapping, JobRequirementMappingUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

export type SaveJobRequirementMappingArgs = {
  jobTargetId: string;
  requirementSkillId: string;
  episodeIds?: string[];
  userNote?: string;
};

/**
 * (jobTargetId, requirementSkillId) のペアで upsert する。
 * 同じペアの mapping が既に存在すれば update、なければ新規作成。
 */
export async function saveJobRequirementMapping(
  args: SaveJobRequirementMappingArgs,
): Promise<JobRequirementMapping> {
  return invoke<JobRequirementMapping>('save_job_requirement_mapping', { args });
}

export async function listJobRequirementMappingsByJobTarget(
  jobTargetId: string,
): Promise<JobRequirementMapping[]> {
  return invoke<JobRequirementMapping[]>('list_job_requirement_mappings_by_job_target', {
    jobTargetId,
  });
}

export async function getJobRequirementMapping(
  id: string,
): Promise<JobRequirementMapping | null> {
  return invoke<JobRequirementMapping | null>('get_job_requirement_mapping', { id });
}

export async function updateJobRequirementMapping(
  id: string,
  patch: JobRequirementMappingUpdate,
): Promise<JobRequirementMapping> {
  return invoke<JobRequirementMapping>('update_job_requirement_mapping', { id, patch });
}

export async function deleteJobRequirementMapping(id: string): Promise<void> {
  return invoke<void>('delete_job_requirement_mapping', { id });
}
