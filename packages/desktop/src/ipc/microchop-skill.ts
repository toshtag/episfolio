import type { MicrochopSkill, MicrochopSkillUpdate, MicrochopTask } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type RawRow = {
  id: string;
  jobTitle: string;
  industry: string;
  tasks: string;
  transferableSkills: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function parseTasks(json: string): MicrochopTask[] {
  try {
    return JSON.parse(json) as MicrochopTask[];
  } catch {
    return [];
  }
}

function rowToRecord(row: RawRow): MicrochopSkill {
  return {
    ...row,
    tasks: parseTasks(row.tasks),
  };
}

type CreateArgs = {
  jobTitle?: string;
  industry?: string;
  tasks?: MicrochopTask[];
  transferableSkills?: string;
  note?: string | null;
};

type RawCreateArgs = Omit<CreateArgs, 'tasks'> & { tasks?: string };
type RawUpdatePatch = Omit<MicrochopSkillUpdate, 'tasks'> & { tasks?: string };

export async function createMicrochopSkill(args: CreateArgs): Promise<MicrochopSkill> {
  const { tasks, ...rest } = args;
  const raw: RawCreateArgs = { ...rest };
  if (tasks !== undefined) raw.tasks = JSON.stringify(tasks);
  const row = await invoke<RawRow>('create_microchop_skill', { args: raw });
  return rowToRecord(row);
}

export async function listMicrochopSkill(): Promise<MicrochopSkill[]> {
  const rows = await invoke<RawRow[]>('list_microchop_skill');
  return rows.map(rowToRecord);
}

export async function getMicrochopSkill(id: string): Promise<MicrochopSkill | null> {
  const row = await invoke<RawRow | null>('get_microchop_skill', { id });
  return row ? rowToRecord(row) : null;
}

export async function updateMicrochopSkill(
  id: string,
  patch: MicrochopSkillUpdate,
): Promise<MicrochopSkill> {
  const { tasks, ...rest } = patch;
  const raw: RawUpdatePatch = { ...rest };
  if (tasks !== undefined) raw.tasks = JSON.stringify(tasks);
  const row = await invoke<RawRow>('update_microchop_skill', { id, patch: raw });
  return rowToRecord(row);
}

export async function deleteMicrochopSkill(id: string): Promise<void> {
  return invoke<void>('delete_microchop_skill', { id });
}
