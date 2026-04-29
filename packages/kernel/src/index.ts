export const KERNEL_VERSION = '0.1.0';

// domain
export type { Episode, ISO8601, ULID } from './domain/episode.js';
export type { AIRun, AIRunPurpose, AIRunInputSnapshotMode } from './domain/ai-run.js';
export type {
  SkillEvidence,
  SkillEvidenceConfidence,
  SkillEvidenceStatus,
} from './domain/skill-evidence.js';
export type { AIProvider, Settings } from './domain/settings.js';
export { DEFAULT_SETTINGS } from './domain/settings.js';

// schemas
export type { EpisodeDraft, EpisodeInput, EpisodeUpdate } from './schemas/episode.js';
export { EpisodeDraftSchema, EpisodeSchema, EpisodeUpdateSchema } from './schemas/episode.js';
export type { AIRunInput } from './schemas/ai-run.js';
export { AIRunSchema, AIRunInputSnapshotModeSchema } from './schemas/ai-run.js';
export type { SkillEvidenceInput, SkillEvidenceUpdate } from './schemas/skill-evidence.js';
export {
  SkillEvidenceSchema,
  SkillEvidenceUpdateSchema,
  SkillEvidenceConfidenceSchema,
  SkillEvidenceStatusSchema,
} from './schemas/skill-evidence.js';

// ports
export type {
  AIProviderPort,
  AIRequest,
  AIResponse,
  ProviderConfig,
  ProviderCapabilities,
} from './ports/ai-provider-port.js';
export type { SettingsStoragePort } from './ports/settings-storage-port.js';
export type { EpisodeStoragePort } from './ports/storage-port.js';
export type { AIRunStoragePort } from './ports/ai-run-storage-port.js';
export type { SkillEvidenceStoragePort } from './ports/skill-evidence-storage-port.js';

// prompts
export { PROMPT_ID, PROMPT_VERSION, PROMPT_TEMPLATE } from './prompts/extract-evidence-v1.js';

// contracts
export type {
  ExtractEvidenceInput,
  ExtractEvidenceOutput,
  ExtractEvidenceCandidate,
} from './contracts/extract-evidence.js';
export {
  ExtractEvidenceInputSchema,
  ExtractEvidenceOutputSchema,
  ExtractEvidenceCandidateSchema,
} from './contracts/extract-evidence.js';

// usecases
export { extractEvidence } from './usecases/extract-evidence.js';
export type { ExtractEvidenceDeps } from './usecases/extract-evidence.js';

// errors
export { RemoteLLMBlockedError } from './errors.js';
