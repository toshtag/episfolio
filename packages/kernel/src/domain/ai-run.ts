import type { ULID, ISO8601 } from './episode.js';

export type AIRunPurpose = 'extract_evidence' | 'generate_document' | 'review' | string;

export type AIRunInputSnapshotMode = 'full' | 'redacted' | 'references_only';

export type AIRun = {
  id: ULID;
  provider: string;
  model: string;
  purpose: AIRunPurpose;
  promptId: string;
  promptVersion: string;
  promptHash: string;
  modelParams: { temperature?: number; topP?: number; seed?: number } | null;
  inputSnapshotMode: AIRunInputSnapshotMode;
  inputSnapshot: string | null;
  inputReferences: { episodeIds?: ULID[]; evidenceIds?: ULID[] } | null;
  outputRaw: string;
  outputParsed: unknown;
  parseError: string | null;
  tokenUsage: { input: number; output: number; total: number } | null;
  costEstimateUSD: number | null;
  createdAt: ISO8601;
};
