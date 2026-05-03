import type { BusinessUnitTypeMatch, BusinessUnitTypeMatchUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawRow = {
  id: string;
  jobTargetId: string;
  companyUnitType: string | null;
  selfType: string | null;
  isMatchConfirmed: boolean;
  matchNote: string | null;
  motivationDraft: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToRecord(row: RawRow): BusinessUnitTypeMatch {
  return {
    ...row,
    companyUnitType: (row.companyUnitType as BusinessUnitTypeMatch['companyUnitType']) ?? null,
    selfType: (row.selfType as BusinessUnitTypeMatch['selfType']) ?? null,
  };
}

type CreateArgs = {
  jobTargetId: string;
  companyUnitType?: string | null;
  selfType?: string | null;
  isMatchConfirmed?: boolean;
  matchNote?: string | null;
  motivationDraft?: string | null;
  note?: string | null;
};

export async function createBusinessUnitTypeMatch(
  args: CreateArgs,
): Promise<BusinessUnitTypeMatch> {
  const row = await invoke<RawRow>('create_business_unit_type_match', { args });
  return rowToRecord(row);
}

export async function listBusinessUnitTypeMatchesByJobTarget(
  jobTargetId: string,
): Promise<BusinessUnitTypeMatch[]> {
  const rows = await invoke<RawRow[]>('list_business_unit_type_matches_by_job_target', {
    jobTargetId,
  });
  return rows.map(rowToRecord);
}

export async function getBusinessUnitTypeMatch(id: string): Promise<BusinessUnitTypeMatch | null> {
  const row = await invoke<RawRow | null>('get_business_unit_type_match', { id });
  return row ? rowToRecord(row) : null;
}

export async function updateBusinessUnitTypeMatch(
  id: string,
  patch: BusinessUnitTypeMatchUpdate,
): Promise<BusinessUnitTypeMatch> {
  const row = await invoke<RawRow>('update_business_unit_type_match', { id, patch });
  return rowToRecord(row);
}

export async function deleteBusinessUnitTypeMatch(id: string): Promise<void> {
  return invoke<void>('delete_business_unit_type_match', { id });
}
