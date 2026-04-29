import type { ULID, ISO8601 } from './episode.js';

export type SkillEvidenceConfidence = 'low' | 'medium' | 'high';
export type SkillEvidenceStatus = 'candidate' | 'accepted' | 'rejected';

export type SkillEvidence = {
  id: ULID;
  strengthLabel: string;
  description: string;
  evidenceEpisodeIds: ULID[];
  reproducibility: string;
  evaluatedContext: string;
  confidence: SkillEvidenceConfidence;
  status: SkillEvidenceStatus;
  createdBy: 'human' | 'ai';
  sourceAIRunId: ULID | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
