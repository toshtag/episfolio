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
  createdBy: 'human' | 'ai';
  sourceAiRunId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExtractEvidenceResult = {
  evidences: SkillEvidenceRow[];
  aiRunId: string;
  parseError: string | null;
};

export async function extractEvidence(
  episodeIds: string[],
  model?: string,
): Promise<ExtractEvidenceResult> {
  return invoke<ExtractEvidenceResult>('extract_evidence', {
    args: { episodeIds, model },
  });
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
