import type { WorkAssetSummary, WorkAssetSummaryUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type CreateWorkAssetSummaryArgs = {
  title?: string;
  assetType?: string;
  jobContext?: string | null;
  period?: string | null;
  role?: string | null;
  summary?: string | null;
  strengthEpisode?: string | null;
  talkingPoints?: string | null;
  maskingNote?: string | null;
};

export async function createWorkAssetSummary(
  args: CreateWorkAssetSummaryArgs,
): Promise<WorkAssetSummary> {
  return invoke<WorkAssetSummary>('create_work_asset_summary', { args });
}

export async function listWorkAssetSummaries(): Promise<WorkAssetSummary[]> {
  return invoke<WorkAssetSummary[]>('list_work_asset_summaries');
}

export async function getWorkAssetSummary(id: string): Promise<WorkAssetSummary | null> {
  return invoke<WorkAssetSummary | null>('get_work_asset_summary', { id });
}

export async function updateWorkAssetSummary(
  id: string,
  patch: WorkAssetSummaryUpdate,
): Promise<WorkAssetSummary> {
  return invoke<WorkAssetSummary>('update_work_asset_summary', { id, patch });
}

export async function deleteWorkAssetSummary(id: string): Promise<void> {
  return invoke<void>('delete_work_asset_summary', { id });
}
