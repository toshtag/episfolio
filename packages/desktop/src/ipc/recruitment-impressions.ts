import type {
  RecruitmentImpression,
  RecruitmentImpressionUpdate,
  SensoryObservation,
} from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawRow = {
  id: string;
  jobTargetId: string;
  selectionProcessNote: string | null;
  officeAtmosphere: string | null;
  sensoryObservations: string;
  lifestyleCompatibilityNote: string | null;
  redFlagsNote: string | null;
  overallImpression: string | null;
  createdAt: string;
  updatedAt: string;
};

function parseObservations(json: string): SensoryObservation[] {
  try {
    return JSON.parse(json) as SensoryObservation[];
  } catch {
    return [];
  }
}

function rowToRecord(row: RawRow): RecruitmentImpression {
  return {
    ...row,
    sensoryObservations: parseObservations(row.sensoryObservations),
  };
}

type CreateArgs = {
  jobTargetId: string;
  selectionProcessNote?: string | null;
  officeAtmosphere?: string | null;
  sensoryObservations?: SensoryObservation[];
  lifestyleCompatibilityNote?: string | null;
  redFlagsNote?: string | null;
  overallImpression?: string | null;
};

type RawCreateArgs = Omit<CreateArgs, 'sensoryObservations'> & {
  sensoryObservations?: string;
};
type RawUpdatePatch = Omit<RecruitmentImpressionUpdate, 'sensoryObservations'> & {
  sensoryObservations?: string;
};

export async function createRecruitmentImpression(
  args: CreateArgs,
): Promise<RecruitmentImpression> {
  const { sensoryObservations, ...rest } = args;
  const raw: RawCreateArgs = { ...rest };
  if (sensoryObservations !== undefined)
    raw.sensoryObservations = JSON.stringify(sensoryObservations);
  const row = await invoke<RawRow>('create_recruitment_impression', { args: raw });
  return rowToRecord(row);
}

export async function listRecruitmentImpressionsByJobTarget(
  jobTargetId: string,
): Promise<RecruitmentImpression[]> {
  const rows = await invoke<RawRow[]>('list_recruitment_impressions_by_job_target', {
    jobTargetId,
  });
  return rows.map(rowToRecord);
}

export async function getRecruitmentImpression(
  id: string,
): Promise<RecruitmentImpression | null> {
  const row = await invoke<RawRow | null>('get_recruitment_impression', { id });
  return row ? rowToRecord(row) : null;
}

export async function updateRecruitmentImpression(
  id: string,
  patch: RecruitmentImpressionUpdate,
): Promise<RecruitmentImpression> {
  const { sensoryObservations, ...rest } = patch;
  const raw: RawUpdatePatch = { ...rest };
  if (sensoryObservations !== undefined)
    raw.sensoryObservations = JSON.stringify(sensoryObservations);
  const row = await invoke<RawRow>('update_recruitment_impression', { id, patch: raw });
  return rowToRecord(row);
}

export async function deleteRecruitmentImpression(id: string): Promise<void> {
  return invoke<void>('delete_recruitment_impression', { id });
}
