import type { MicrochopSkill } from '../domain/microchop-skill.js';
import type { MicrochopSkillUpdate } from '../schemas/microchop-skill.js';

export interface MicrochopSkillStoragePort {
  create(record: MicrochopSkill): Promise<MicrochopSkill>;
  list(): Promise<MicrochopSkill[]>;
  get(id: string): Promise<MicrochopSkill | null>;
  update(id: string, patch: MicrochopSkillUpdate): Promise<MicrochopSkill>;
  delete(id: string): Promise<void>;
}
