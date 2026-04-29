import type { SkillEvidence } from '../domain/skill-evidence.js';
import type { SkillEvidenceUpdate } from '../schemas/skill-evidence.js';

export interface SkillEvidenceStoragePort {
  save(evidence: SkillEvidence): Promise<SkillEvidence>;
  saveMany(evidences: SkillEvidence[]): Promise<SkillEvidence[]>;
  list(): Promise<SkillEvidence[]>;
  get(id: string): Promise<SkillEvidence | null>;
  update(id: string, patch: SkillEvidenceUpdate): Promise<SkillEvidence>;
}
