import type { ISO8601, ULID } from './types.js';

export type MicrochopTask = {
  id: ULID;
  label: string;
  transferable: boolean;
};

export type MicrochopSkill = {
  id: ULID;
  jobTitle: string;
  industry: string;
  tasks: MicrochopTask[];
  transferableSkills: string;
  note: string | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
