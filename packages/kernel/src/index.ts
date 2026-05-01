export const KERNEL_VERSION = '0.2.2';

// contracts
export type {
  ExtractEvidenceCandidate,
  ExtractEvidenceInput,
  ExtractEvidenceOutput,
} from './contracts/extract-evidence.js';
export {
  ExtractEvidenceCandidateSchema,
  ExtractEvidenceInputSchema,
  ExtractEvidenceOutputSchema,
} from './contracts/extract-evidence.js';
export type {
  DocumentSection,
  GenerateDocumentInput,
  GenerateDocumentOutput,
} from './contracts/generate-document.js';
export {
  DocumentSectionSchema,
  GenerateDocumentInputSchema,
  GenerateDocumentOutputSchema,
} from './contracts/generate-document.js';
export type { AIRun, AIRunInputSnapshotMode, AIRunPurpose } from './domain/ai-run.js';
export type {
  CareerDocument,
  CareerDocumentStatus,
  CareerDocumentType,
  DocumentRevision,
} from './domain/career-document.js';
// domain
export type { Episode, ISO8601, ULID } from './domain/episode.js';
export type { JobTarget, JobTargetStatus, SkillItem } from './domain/job-target.js';
export type {
  LifeTimelineCategory,
  LifeTimelineEntry,
} from './domain/life-timeline-entry.js';
export type { AIProvider, Settings } from './domain/settings.js';
export { DEFAULT_SETTINGS } from './domain/settings.js';
export type {
  SkillEvidence,
  SkillEvidenceConfidence,
  SkillEvidenceSource,
  SkillEvidenceStatus,
} from './domain/skill-evidence.js';
// errors
export { RemoteLLMBlockedError } from './errors.js';
// exporters
export { toJibunTaizenMarkdown } from './exporters/jibun-taizen.js';
export type { DiffHunk } from './exporters/revision-diff.js';
export { computeUnifiedDiff, formatUnifiedDiff } from './exporters/revision-diff.js';
// ports
export type {
  AIProviderPort,
  AIRequest,
  AIResponse,
  ProviderCapabilities,
  ProviderConfig,
} from './ports/ai-provider-port.js';
export type { AIRunStoragePort } from './ports/ai-run-storage-port.js';
export type { CareerDocumentStoragePort } from './ports/career-document-storage-port.js';
export type { DocumentRevisionStoragePort } from './ports/document-revision-storage-port.js';
export type { JobTargetStoragePort } from './ports/job-target-storage-port.js';
export type { LifeTimelineStoragePort } from './ports/life-timeline-storage-port.js';
export type { SettingsStoragePort } from './ports/settings-storage-port.js';
export type { SkillEvidenceStoragePort } from './ports/skill-evidence-storage-port.js';
export type { EpisodeStoragePort } from './ports/storage-port.js';
// prompts
export { PROMPT_ID, PROMPT_TEMPLATE, PROMPT_VERSION } from './prompts/extract-evidence-v1.js';
export {
  PROMPT_ID as GENERATE_DOCUMENT_PROMPT_ID,
  PROMPT_TEMPLATE as GENERATE_DOCUMENT_PROMPT_TEMPLATE,
  PROMPT_VERSION as GENERATE_DOCUMENT_PROMPT_VERSION,
} from './prompts/generate-document-v1.js';
export type { AIRunInput } from './schemas/ai-run.js';
export { AIRunInputSnapshotModeSchema, AIRunSchema } from './schemas/ai-run.js';
export type {
  CareerDocumentInput,
  CareerDocumentUpdate,
  DocumentRevisionInput,
} from './schemas/career-document.js';
export {
  CareerDocumentSchema,
  CareerDocumentStatusSchema,
  CareerDocumentTypeSchema,
  CareerDocumentUpdateSchema,
  DocumentRevisionSchema,
} from './schemas/career-document.js';
export type { JobTargetInput, JobTargetUpdate } from './schemas/job-target.js';
export {
  JobTargetSchema,
  JobTargetStatusSchema,
  JobTargetUpdateSchema,
  SkillItemSchema,
} from './schemas/job-target.js';
export type { EpisodeDraft, EpisodeInput, EpisodeUpdate } from './schemas/episode.js';
export { EpisodeDraftSchema, EpisodeSchema, EpisodeUpdateSchema } from './schemas/episode.js';
// schemas
export type {
  LifeTimelineEntryInput,
  LifeTimelineEntryUpdate,
} from './schemas/life-timeline-entry.js';
export {
  LifeTimelineCategorySchema,
  LifeTimelineEntrySchema,
  LifeTimelineEntryUpdateSchema,
} from './schemas/life-timeline-entry.js';
export type { SkillEvidenceInput, SkillEvidenceUpdate } from './schemas/skill-evidence.js';
export {
  SkillEvidenceConfidenceSchema,
  SkillEvidenceSchema,
  SkillEvidenceSourceSchema,
  SkillEvidenceStatusSchema,
  SkillEvidenceUpdateSchema,
} from './schemas/skill-evidence.js';
export type { ExtractEvidenceDeps } from './usecases/extract-evidence.js';
// usecases
export { extractEvidence } from './usecases/extract-evidence.js';
export type { GenerateDocumentDeps, GenerateDocumentResult } from './usecases/generate-document.js';
export { generateDocument } from './usecases/generate-document.js';
