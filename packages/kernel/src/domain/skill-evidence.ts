import type { ISO8601, ULID } from './types.js';

export type SkillEvidenceConfidence = 'low' | 'medium' | 'high';
export type SkillEvidenceStatus = 'candidate' | 'accepted' | 'rejected';
export type SkillEvidenceSource = 'manual' | 'ai-generated';

export type SkillEvidence = {
  id: ULID;
  strengthLabel: string;
  description: string;
  evidenceEpisodeIds: ULID[];
  reproducibility: string;
  evaluatedContext: string;
  confidence: SkillEvidenceConfidence;
  status: SkillEvidenceStatus;
  source: SkillEvidenceSource;
  createdBy: 'human' | 'ai';
  sourceAIRunId: ULID | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
