import type { BossReference, BossReferenceUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type CreateBossReferenceArgs = {
  bossName?: string | null;
  companyName?: string;
  period?: string;
  axisLogicVsEmotion?: number;
  axisResultVsProcess?: number;
  axisSoloVsTeam?: number;
  axisFutureVsTradition?: number;
  axisSharesPrivate?: number;
  axisTeachingSkill?: number;
  axisListening?: number;
  axisBusyness?: number;
  q1?: string | null;
  q2?: string | null;
  q3?: string | null;
  q4?: string | null;
  q5?: string | null;
  q6?: string | null;
  q7?: string | null;
  q8?: string | null;
  q9?: string | null;
  q10?: string | null;
  q11?: string | null;
  strengthEpisode?: string | null;
};

export async function createBossReference(args: CreateBossReferenceArgs): Promise<BossReference> {
  return invoke<BossReference>('create_boss_reference', { args });
}

export async function listBossReferences(): Promise<BossReference[]> {
  return invoke<BossReference[]>('list_boss_references');
}

export async function getBossReference(id: string): Promise<BossReference | null> {
  return invoke<BossReference | null>('get_boss_reference', { id });
}

export async function updateBossReference(
  id: string,
  patch: BossReferenceUpdate,
): Promise<BossReference> {
  return invoke<BossReference>('update_boss_reference', { id, patch });
}

export async function deleteBossReference(id: string): Promise<void> {
  return invoke<void>('delete_boss_reference', { id });
}
