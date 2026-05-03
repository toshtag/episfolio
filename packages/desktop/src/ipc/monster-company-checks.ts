import type {
  MonsterCompanyCheck,
  MonsterCompanyCheckUpdate,
  ResignationEntry,
} from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawRow = {
  id: string;
  jobTargetId: string;
  mhlwCaseUrl: string | null;
  violationLaw: string | null;
  caseSummary: string | null;
  casePublicationDate: string | null;
  resignationEntries: string;
  hiddenMonsterNote: string | null;
  createdAt: string;
  updatedAt: string;
};

function parseEntries(json: string): ResignationEntry[] {
  try {
    return JSON.parse(json) as ResignationEntry[];
  } catch {
    return [];
  }
}

function rowToRecord(row: RawRow): MonsterCompanyCheck {
  return {
    ...row,
    resignationEntries: parseEntries(row.resignationEntries),
  };
}

type CreateArgs = {
  jobTargetId: string;
  mhlwCaseUrl?: string | null;
  violationLaw?: string | null;
  caseSummary?: string | null;
  casePublicationDate?: string | null;
  resignationEntries?: ResignationEntry[];
  hiddenMonsterNote?: string | null;
};

type RawCreateArgs = Omit<CreateArgs, 'resignationEntries'> & { resignationEntries?: string };
type RawUpdatePatch = Omit<MonsterCompanyCheckUpdate, 'resignationEntries'> & {
  resignationEntries?: string;
};

export async function createMonsterCompanyCheck(args: CreateArgs): Promise<MonsterCompanyCheck> {
  const { resignationEntries, ...rest } = args;
  const raw: RawCreateArgs = { ...rest };
  if (resignationEntries !== undefined) raw.resignationEntries = JSON.stringify(resignationEntries);
  const row = await invoke<RawRow>('create_monster_company_check', { args: raw });
  return rowToRecord(row);
}

export async function listMonsterCompanyChecksByJobTarget(
  jobTargetId: string,
): Promise<MonsterCompanyCheck[]> {
  const rows = await invoke<RawRow[]>('list_monster_company_checks_by_job_target', {
    jobTargetId,
  });
  return rows.map(rowToRecord);
}

export async function getMonsterCompanyCheck(id: string): Promise<MonsterCompanyCheck | null> {
  const row = await invoke<RawRow | null>('get_monster_company_check', { id });
  return row ? rowToRecord(row) : null;
}

export async function updateMonsterCompanyCheck(
  id: string,
  patch: MonsterCompanyCheckUpdate,
): Promise<MonsterCompanyCheck> {
  const { resignationEntries, ...rest } = patch;
  const raw: RawUpdatePatch = { ...rest };
  if (resignationEntries !== undefined) raw.resignationEntries = JSON.stringify(resignationEntries);
  const row = await invoke<RawRow>('update_monster_company_check', { id, patch: raw });
  return rowToRecord(row);
}

export async function deleteMonsterCompanyCheck(id: string): Promise<void> {
  return invoke<void>('delete_monster_company_check', { id });
}
