import type { JobWishCompany, JobWishSheet, JobWishSheetUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawJobWishSheetRow = {
  id: string;
  agentTrackRecordId: string | null;
  title: string;
  desiredIndustry: string;
  desiredRole: string;
  desiredSalary: string;
  desiredLocation: string;
  desiredWorkStyle: string;
  otherConditions: string;
  groupACompanies: string;
  groupBCompanies: string;
  groupCCompanies: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

function parseCompanies(json: string): JobWishCompany[] {
  try {
    return JSON.parse(json) as JobWishCompany[];
  } catch {
    return [];
  }
}

function rowToSheet(row: RawJobWishSheetRow): JobWishSheet {
  return {
    ...row,
    groupACompanies: parseCompanies(row.groupACompanies),
    groupBCompanies: parseCompanies(row.groupBCompanies),
    groupCCompanies: parseCompanies(row.groupCCompanies),
  };
}

type CreateJobWishSheetArgs = {
  agentTrackRecordId?: string | null;
  title?: string;
  desiredIndustry?: string;
  desiredRole?: string;
  desiredSalary?: string;
  desiredLocation?: string;
  desiredWorkStyle?: string;
  otherConditions?: string;
  groupACompanies?: JobWishCompany[];
  groupBCompanies?: JobWishCompany[];
  groupCCompanies?: JobWishCompany[];
  memo?: string;
};

type RawCreateArgs = Omit<
  CreateJobWishSheetArgs,
  'groupACompanies' | 'groupBCompanies' | 'groupCCompanies'
> & {
  groupACompanies?: string;
  groupBCompanies?: string;
  groupCCompanies?: string;
};

type RawUpdatePatch = Omit<
  JobWishSheetUpdate,
  'groupACompanies' | 'groupBCompanies' | 'groupCCompanies'
> & {
  groupACompanies?: string;
  groupBCompanies?: string;
  groupCCompanies?: string;
};

export async function createJobWishSheet(args: CreateJobWishSheetArgs): Promise<JobWishSheet> {
  const { groupACompanies, groupBCompanies, groupCCompanies, ...rest } = args;
  const raw: RawCreateArgs = { ...rest };
  if (groupACompanies !== undefined) raw.groupACompanies = JSON.stringify(groupACompanies);
  if (groupBCompanies !== undefined) raw.groupBCompanies = JSON.stringify(groupBCompanies);
  if (groupCCompanies !== undefined) raw.groupCCompanies = JSON.stringify(groupCCompanies);
  const row = await invoke<RawJobWishSheetRow>('create_job_wish_sheet', { args: raw });
  return rowToSheet(row);
}

export async function listJobWishSheets(): Promise<JobWishSheet[]> {
  const rows = await invoke<RawJobWishSheetRow[]>('list_job_wish_sheets');
  return rows.map(rowToSheet);
}

export async function getJobWishSheet(id: string): Promise<JobWishSheet | null> {
  const row = await invoke<RawJobWishSheetRow | null>('get_job_wish_sheet', { id });
  return row ? rowToSheet(row) : null;
}

export async function updateJobWishSheet(
  id: string,
  patch: JobWishSheetUpdate,
): Promise<JobWishSheet> {
  const { groupACompanies, groupBCompanies, groupCCompanies, ...rest } = patch;
  const raw: RawUpdatePatch = { ...rest };
  if (groupACompanies !== undefined) raw.groupACompanies = JSON.stringify(groupACompanies);
  if (groupBCompanies !== undefined) raw.groupBCompanies = JSON.stringify(groupBCompanies);
  if (groupCCompanies !== undefined) raw.groupCCompanies = JSON.stringify(groupCCompanies);
  const row = await invoke<RawJobWishSheetRow>('update_job_wish_sheet', { id, patch: raw });
  return rowToSheet(row);
}

export async function deleteJobWishSheet(id: string): Promise<void> {
  return invoke<void>('delete_job_wish_sheet', { id });
}
