import { invoke } from '@tauri-apps/api/core';

export type SkillEvidenceRow = {
  id: string;
  strengthLabel: string;
  description: string;
  evidenceEpisodeIds: string[];
  reproducibility: string;
  evaluatedContext: string;
  confidence: 'low' | 'medium' | 'high';
  status: 'candidate' | 'accepted' | 'rejected';
  source: 'manual' | 'ai-generated';
  createdBy: 'human' | 'ai';
  sourceAiRunId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateManualEvidenceArgs = {
  strengthLabel: string;
  description: string;
  evidenceEpisodeIds: string[];
  reproducibility?: string;
  evaluatedContext?: string;
  confidence?: 'low' | 'medium' | 'high';
};

export async function createSkillEvidenceManual(
  args: CreateManualEvidenceArgs,
): Promise<SkillEvidenceRow> {
  return invoke<SkillEvidenceRow>('create_skill_evidence_manual', { args });
}

export async function listSkillEvidence(): Promise<SkillEvidenceRow[]> {
  return invoke<SkillEvidenceRow[]>('list_skill_evidence');
}

export async function updateSkillEvidenceStatus(
  id: string,
  status: 'candidate' | 'accepted' | 'rejected',
): Promise<SkillEvidenceRow> {
  return invoke<SkillEvidenceRow>('update_skill_evidence_status', {
    args: { id, status },
  });
}
