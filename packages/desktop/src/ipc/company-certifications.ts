import type { CompanyCertification, CompanyCertificationUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawRow = {
  id: string;
  jobTargetId: string;
  hasKurumin: boolean;
  hasPlatinumKurumin: boolean;
  hasTomoni: boolean;
  eruboshiLevel: number | null;
  hasPlatinumEruboshi: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToRecord(row: RawRow): CompanyCertification {
  return { ...row };
}

type CreateArgs = {
  jobTargetId: string;
  hasKurumin?: boolean;
  hasPlatinumKurumin?: boolean;
  hasTomoni?: boolean;
  eruboshiLevel?: number | null;
  hasPlatinumEruboshi?: boolean;
  note?: string | null;
};

export async function createCompanyCertification(args: CreateArgs): Promise<CompanyCertification> {
  const row = await invoke<RawRow>('create_company_certification', { args });
  return rowToRecord(row);
}

export async function listCompanyCertificationsByJobTarget(
  jobTargetId: string,
): Promise<CompanyCertification[]> {
  const rows = await invoke<RawRow[]>('list_company_certifications_by_job_target', { jobTargetId });
  return rows.map(rowToRecord);
}

export async function getCompanyCertification(id: string): Promise<CompanyCertification | null> {
  const row = await invoke<RawRow | null>('get_company_certification', { id });
  return row ? rowToRecord(row) : null;
}

export async function updateCompanyCertification(
  id: string,
  patch: CompanyCertificationUpdate,
): Promise<CompanyCertification> {
  const row = await invoke<RawRow>('update_company_certification', { id, patch });
  return rowToRecord(row);
}

export async function deleteCompanyCertification(id: string): Promise<void> {
  return invoke<void>('delete_company_certification', { id });
}
