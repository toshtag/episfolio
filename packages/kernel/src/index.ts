export const KERNEL_VERSION = '0.11.0';

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
export type { AgentMeetingEmail } from './domain/agent-meeting-email.js';
export type {
  AgentTrackRecord,
  AgentTrackRecordStatus,
  ConsultantQuality,
} from './domain/agent-track-record.js';
export type { AIRun, AIRunInputSnapshotMode, AIRunPurpose } from './domain/ai-run.js';
export type {
  ApplicationMotive,
  InfoSourceType,
  IronApplicationMotive,
  SelfIdentification,
  StandardApplicationMotive,
  ValueAnalysisType,
} from './domain/application-motive.js';
export type {
  BossReference,
  BossReferenceAxis,
  BossReferenceAxisValues,
} from './domain/boss-reference.js';
export type {
  BusinessUnitType,
  BusinessUnitTypeMatch,
} from './domain/business-unit-type-match.js';
export type {
  CareerDocument,
  CareerDocumentStatus,
  CareerDocumentType,
  DocumentRevision,
} from './domain/career-document.js';
export type { CompanyCertification } from './domain/company-certification.js';
export type { CustomerReference, CustomerType } from './domain/customer-reference.js';
// domain
export type { Episode, ISO8601, ULID } from './domain/episode.js';
export type { GrowthCycleNote, GrowthStage } from './domain/growth-cycle-note.js';
export type { HiddenGemNote } from './domain/hidden-gem-note.js';
export type {
  InterviewQA,
  InterviewQACategory,
  InterviewQASource,
} from './domain/interview-qa.js';
export type {
  InterviewerStyle,
  InterviewReport,
  InterviewStage,
  ResponseImpression,
} from './domain/interview-report.js';
export type { JobRequirementMapping } from './domain/job-requirement-mapping.js';
export type {
  ApplicationRoute,
  EmploymentType,
  JobTarget,
  JobTargetStatus,
  SkillItem,
  WageType,
} from './domain/job-target.js';
export type { JobWishCompany, JobWishSheet } from './domain/job-wish-sheet.js';
export type {
  LifeTimelineCategory,
  LifeTimelineEntry,
} from './domain/life-timeline-entry.js';
export type { MicrochopSkill, MicrochopTask } from './domain/microchop-skill.js';
export type {
  MonsterCompanyCheck,
  ResignationEntry,
} from './domain/monster-company-check.js';
export type {
  RecruitmentImpression,
  SensoryObservation,
} from './domain/recruitment-impression.js';
export type { ResignationMotive } from './domain/resignation-motive.js';
export type { RecruitmentBackground, ResignationPlan } from './domain/resignation-plan.js';
export type { ResultByType, ResultEntry, ResultType } from './domain/result-by-type.js';
export type { SalaryBenchmark } from './domain/salary-benchmark.js';
export type { AIProvider, Settings } from './domain/settings.js';
export { DEFAULT_SETTINGS } from './domain/settings.js';
export type {
  SkillEvidence,
  SkillEvidenceConfidence,
  SkillEvidenceSource,
  SkillEvidenceStatus,
} from './domain/skill-evidence.js';
export type { StrengthArrow, StrengthArrowType } from './domain/strength-arrow.js';
export type { BlankType, StrengthFromWeakness } from './domain/strength-from-weakness.js';
export type {
  SubordinateRow,
  SubordinateSummary,
} from './domain/subordinate-summary.js';
export type {
  ContactStatus,
  WeakConnection,
  WeakConnectionCategory,
} from './domain/weak-connection.js';
export type { AssetType, WorkAssetSummary } from './domain/work-asset-summary.js';
// errors
export { RemoteLLMBlockedError } from './errors.js';
export { composeApplicationMotiveText } from './exporters/application-motive.js';
// exporters
export { toBossReferenceMarkdown } from './exporters/boss-reference.js';
export { toBusinessUnitTypeMatchMarkdown } from './exporters/business-unit-type-match.js';
export { toCareerDigestMarkdown } from './exporters/career-digest.js';
export { toCompanyCertificationMarkdown } from './exporters/company-certification.js';
export { toCustomerReferenceMarkdown } from './exporters/customer-reference.js';
export { toGrowthCycleNoteMarkdown } from './exporters/growth-cycle-note.js';
export { toHiddenGemNoteMarkdown } from './exporters/hidden-gem-note.js';
export { toJibunTaizenMarkdown } from './exporters/jibun-taizen.js';
export { toJobWishSheetMarkdown } from './exporters/job-wish-sheet.js';
export { toMicrochopSkillMarkdown } from './exporters/microchop-skill.js';
export { toMonsterCompanyCheckMarkdown } from './exporters/monster-company-check.js';
export { toRecruitmentImpressionMarkdown } from './exporters/recruitment-impression.js';
export { toResultByTypeMarkdown } from './exporters/result-by-type.js';
export type { DiffHunk } from './exporters/revision-diff.js';
export { computeUnifiedDiff, formatUnifiedDiff } from './exporters/revision-diff.js';
export { toSalaryBenchmarkMarkdown } from './exporters/salary-benchmark.js';
export { toStrengthArrowMarkdown } from './exporters/strength-arrow.js';
export { toStrengthFromWeaknessMarkdown } from './exporters/strength-from-weakness.js';
export type { SubordinateSummaryMarkdownOptions } from './exporters/subordinate-summary.js';
export { toSubordinateSummaryMarkdown } from './exporters/subordinate-summary.js';
export { toWeakConnectionMarkdown } from './exporters/weak-connection.js';
export { toWorkAssetSummaryMarkdown } from './exporters/work-asset-summary.js';
export type { AgentMeetingEmailStoragePort } from './ports/agent-meeting-email-storage-port.js';
export type { AgentTrackRecordStoragePort } from './ports/agent-track-record-storage-port.js';
// ports
export type {
  AIProviderPort,
  AIRequest,
  AIResponse,
  ProviderCapabilities,
  ProviderConfig,
} from './ports/ai-provider-port.js';
export type { AIRunStoragePort } from './ports/ai-run-storage-port.js';
export type { ApplicationMotiveStoragePort } from './ports/application-motive-storage-port.js';
export type { BossReferenceStoragePort } from './ports/boss-reference-storage-port.js';
export type { BusinessUnitTypeMatchStoragePort } from './ports/business-unit-type-match-storage-port.js';
export type { CareerDocumentStoragePort } from './ports/career-document-storage-port.js';
export type { CompanyCertificationStoragePort } from './ports/company-certification-storage-port.js';
export type { CustomerReferenceStoragePort } from './ports/customer-reference-storage-port.js';
export type { DocumentRevisionStoragePort } from './ports/document-revision-storage-port.js';
export type { GrowthCycleNoteStoragePort } from './ports/growth-cycle-note-storage-port.js';
export type { HiddenGemNoteStoragePort } from './ports/hidden-gem-note-storage-port.js';
export type { InterviewQAStoragePort } from './ports/interview-qa-storage-port.js';
export type { InterviewReportStoragePort } from './ports/interview-report-storage-port.js';
export type { JobRequirementMappingStoragePort } from './ports/job-requirement-mapping-storage-port.js';
export type { JobTargetStoragePort } from './ports/job-target-storage-port.js';
export type { JobWishSheetStoragePort } from './ports/job-wish-sheet-storage-port.js';
export type { LifeTimelineStoragePort } from './ports/life-timeline-storage-port.js';
export type { MicrochopSkillStoragePort } from './ports/microchop-skill-storage-port.js';
export type { MonsterCompanyCheckStoragePort } from './ports/monster-company-check-storage-port.js';
export type { RecruitmentImpressionStoragePort } from './ports/recruitment-impression-storage-port.js';
export type { ResignationMotiveStoragePort } from './ports/resignation-motive-storage-port.js';
export type { ResignationPlanStoragePort } from './ports/resignation-plan-storage-port.js';
export type { ResultByTypeStoragePort } from './ports/result-by-type-storage-port.js';
export type { SalaryBenchmarkStoragePort } from './ports/salary-benchmark-storage-port.js';
export type { SettingsStoragePort } from './ports/settings-storage-port.js';
export type { SkillEvidenceStoragePort } from './ports/skill-evidence-storage-port.js';
export type { EpisodeStoragePort } from './ports/storage-port.js';
export type { StrengthArrowStoragePort } from './ports/strength-arrow-storage-port.js';
export type { StrengthFromWeaknessStoragePort } from './ports/strength-from-weakness-storage-port.js';
export type { SubordinateSummaryStoragePort } from './ports/subordinate-summary-storage-port.js';
export type { WeakConnectionStoragePort } from './ports/weak-connection-storage-port.js';
export type { WorkAssetSummaryStoragePort } from './ports/work-asset-summary-storage-port.js';
// prompts
export { PROMPT_ID, PROMPT_TEMPLATE, PROMPT_VERSION } from './prompts/extract-evidence-v1.js';
export {
  PROMPT_ID as GENERATE_DOCUMENT_PROMPT_ID,
  PROMPT_TEMPLATE as GENERATE_DOCUMENT_PROMPT_TEMPLATE,
  PROMPT_VERSION as GENERATE_DOCUMENT_PROMPT_VERSION,
} from './prompts/generate-document-v1.js';
export type {
  AgentMeetingEmailInput,
  AgentMeetingEmailUpdate,
} from './schemas/agent-meeting-email.js';
export {
  AgentMeetingEmailSchema,
  AgentMeetingEmailUpdateSchema,
} from './schemas/agent-meeting-email.js';
export type {
  AgentTrackRecordInput,
  AgentTrackRecordUpdate,
} from './schemas/agent-track-record.js';
export {
  AgentTrackRecordSchema,
  AgentTrackRecordStatusSchema,
  AgentTrackRecordUpdateSchema,
  ConsultantQualitySchema,
} from './schemas/agent-track-record.js';
export type { AIRunInput } from './schemas/ai-run.js';
export { AIRunInputSnapshotModeSchema, AIRunSchema } from './schemas/ai-run.js';
export type {
  ApplicationMotiveCreate,
  ApplicationMotiveInput,
  ApplicationMotiveUpdate,
} from './schemas/application-motive.js';
export {
  ApplicationMotiveCreateSchema,
  ApplicationMotiveSchema,
  ApplicationMotiveUpdateSchema,
  IronApplicationMotiveSchema,
  StandardApplicationMotiveSchema,
} from './schemas/application-motive.js';
export type {
  BossReferenceInput,
  BossReferenceUpdate,
} from './schemas/boss-reference.js';
export {
  BossReferenceAxisValuesSchema,
  BossReferenceSchema,
  BossReferenceUpdateSchema,
} from './schemas/boss-reference.js';
export type {
  BusinessUnitTypeMatchCreate,
  BusinessUnitTypeMatchInput,
  BusinessUnitTypeMatchUpdate,
} from './schemas/business-unit-type-match.js';
export {
  BusinessUnitTypeMatchCreateSchema,
  BusinessUnitTypeMatchSchema,
  BusinessUnitTypeMatchUpdateSchema,
  BusinessUnitTypeSchema,
} from './schemas/business-unit-type-match.js';
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
export type {
  CompanyCertificationCreate,
  CompanyCertificationInput,
  CompanyCertificationUpdate,
} from './schemas/company-certification.js';
export {
  CompanyCertificationCreateSchema,
  CompanyCertificationSchema,
  CompanyCertificationUpdateSchema,
} from './schemas/company-certification.js';
export type {
  CustomerReferenceInput,
  CustomerReferenceUpdate,
} from './schemas/customer-reference.js';
export {
  CustomerReferenceSchema,
  CustomerReferenceUpdateSchema,
  CustomerTypeSchema,
} from './schemas/customer-reference.js';
export type { EpisodeDraft, EpisodeInput, EpisodeUpdate } from './schemas/episode.js';
export { EpisodeDraftSchema, EpisodeSchema, EpisodeUpdateSchema } from './schemas/episode.js';
export type {
  GrowthCycleNoteCreate,
  GrowthCycleNoteInput,
  GrowthCycleNoteUpdate,
} from './schemas/growth-cycle-note.js';
export {
  GrowthCycleNoteCreateSchema,
  GrowthCycleNoteSchema,
  GrowthCycleNoteUpdateSchema,
  GrowthStageSchema,
} from './schemas/growth-cycle-note.js';
export type {
  HiddenGemNoteCreate,
  HiddenGemNoteInput,
  HiddenGemNoteUpdate,
} from './schemas/hidden-gem-note.js';
export {
  HiddenGemNoteCreateSchema,
  HiddenGemNoteSchema,
  HiddenGemNoteUpdateSchema,
} from './schemas/hidden-gem-note.js';
export type { InterviewQAInput, InterviewQAUpdate } from './schemas/interview-qa.js';
export {
  InterviewQACategorySchema,
  InterviewQASchema,
  InterviewQASourceSchema,
  InterviewQAUpdateSchema,
} from './schemas/interview-qa.js';
export type {
  InterviewReportInput,
  InterviewReportUpdate,
} from './schemas/interview-report.js';
export {
  InterviewerStyleSchema,
  InterviewReportSchema,
  InterviewReportUpdateSchema,
  InterviewStageSchema,
  ResponseImpressionSchema,
} from './schemas/interview-report.js';
export type {
  JobRequirementMappingInput,
  JobRequirementMappingUpdate,
} from './schemas/job-requirement-mapping.js';
export {
  JobRequirementMappingSchema,
  JobRequirementMappingUpdateSchema,
} from './schemas/job-requirement-mapping.js';
export type { JobTargetInput, JobTargetUpdate } from './schemas/job-target.js';
export {
  ApplicationRouteSchema,
  EmploymentTypeSchema,
  JobTargetSchema,
  JobTargetStatusSchema,
  JobTargetUpdateSchema,
  SkillItemSchema,
  WageTypeSchema,
} from './schemas/job-target.js';
export type {
  JobWishCompanyInput,
  JobWishSheetCreate,
  JobWishSheetInput,
  JobWishSheetUpdate,
} from './schemas/job-wish-sheet.js';
export {
  JobWishCompanySchema,
  JobWishSheetCreateSchema,
  JobWishSheetSchema,
  JobWishSheetUpdateSchema,
} from './schemas/job-wish-sheet.js';
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
export type {
  MicrochopSkillCreate,
  MicrochopSkillInput,
  MicrochopSkillUpdate,
} from './schemas/microchop-skill.js';
export {
  MicrochopSkillCreateSchema,
  MicrochopSkillSchema,
  MicrochopSkillUpdateSchema,
  MicrochopTaskSchema,
} from './schemas/microchop-skill.js';
export type {
  MonsterCompanyCheckCreate,
  MonsterCompanyCheckInput,
  MonsterCompanyCheckUpdate,
  ResignationEntryInput,
} from './schemas/monster-company-check.js';
export {
  MonsterCompanyCheckCreateSchema,
  MonsterCompanyCheckSchema,
  MonsterCompanyCheckUpdateSchema,
  ResignationEntrySchema,
} from './schemas/monster-company-check.js';
export type {
  RecruitmentImpressionCreate,
  RecruitmentImpressionInput,
  RecruitmentImpressionUpdate,
  SensoryObservationInput,
} from './schemas/recruitment-impression.js';
export {
  RecruitmentImpressionCreateSchema,
  RecruitmentImpressionSchema,
  RecruitmentImpressionUpdateSchema,
  SensoryObservationSchema,
} from './schemas/recruitment-impression.js';
export type {
  ResignationMotiveCreate,
  ResignationMotiveInput,
  ResignationMotiveUpdate,
} from './schemas/resignation-motive.js';
export {
  ResignationMotiveCreateSchema,
  ResignationMotiveSchema,
  ResignationMotiveUpdateSchema,
} from './schemas/resignation-motive.js';
export type {
  ResignationPlanInput,
  ResignationPlanUpdate,
} from './schemas/resignation-plan.js';
export {
  RecruitmentBackgroundSchema,
  ResignationPlanSchema,
  ResignationPlanUpdateSchema,
} from './schemas/resignation-plan.js';
export type {
  ResultByTypeCreate,
  ResultByTypeInput,
  ResultByTypeUpdate,
  ResultEntryInput,
} from './schemas/result-by-type.js';
export {
  ResultByTypeCreateSchema,
  ResultByTypeSchema,
  ResultByTypeUpdateSchema,
  ResultEntrySchema,
  ResultTypeSchema,
  SkillTypeSchema,
} from './schemas/result-by-type.js';
export type {
  SalaryBenchmarkCreate,
  SalaryBenchmarkInput,
  SalaryBenchmarkUpdate,
} from './schemas/salary-benchmark.js';
export {
  SalaryBenchmarkCreateSchema,
  SalaryBenchmarkSchema,
  SalaryBenchmarkUpdateSchema,
} from './schemas/salary-benchmark.js';
export type { SkillEvidenceInput, SkillEvidenceUpdate } from './schemas/skill-evidence.js';
export {
  SkillEvidenceConfidenceSchema,
  SkillEvidenceSchema,
  SkillEvidenceSourceSchema,
  SkillEvidenceStatusSchema,
  SkillEvidenceUpdateSchema,
} from './schemas/skill-evidence.js';
export type {
  StrengthArrowCreate,
  StrengthArrowInput,
  StrengthArrowUpdate,
} from './schemas/strength-arrow.js';
export {
  StrengthArrowCreateSchema,
  StrengthArrowSchema,
  StrengthArrowTypeSchema,
  StrengthArrowUpdateSchema,
} from './schemas/strength-arrow.js';
export type {
  StrengthFromWeaknessCreate,
  StrengthFromWeaknessInput,
  StrengthFromWeaknessUpdate,
} from './schemas/strength-from-weakness.js';
export {
  BlankTypeSchema,
  StrengthFromWeaknessCreateSchema,
  StrengthFromWeaknessSchema,
  StrengthFromWeaknessUpdateSchema,
} from './schemas/strength-from-weakness.js';
export type {
  SubordinateRowInput,
  SubordinateSummaryCreate,
  SubordinateSummaryInput,
  SubordinateSummaryUpdate,
} from './schemas/subordinate-summary.js';
export {
  SubordinateRowSchema,
  SubordinateSummaryCreateSchema,
  SubordinateSummarySchema,
  SubordinateSummaryUpdateSchema,
} from './schemas/subordinate-summary.js';
export type {
  WeakConnectionCreate,
  WeakConnectionInput,
  WeakConnectionUpdate,
} from './schemas/weak-connection.js';
export {
  ContactStatusSchema,
  WeakConnectionCategorySchema,
  WeakConnectionCreateSchema,
  WeakConnectionSchema,
  WeakConnectionUpdateSchema,
} from './schemas/weak-connection.js';
export type {
  WorkAssetSummaryInput,
  WorkAssetSummaryUpdate,
} from './schemas/work-asset-summary.js';
export {
  AssetTypeSchema,
  WorkAssetSummarySchema,
  WorkAssetSummaryUpdateSchema,
} from './schemas/work-asset-summary.js';
export type { ExtractEvidenceDeps } from './usecases/extract-evidence.js';
// usecases
export { extractEvidence } from './usecases/extract-evidence.js';
export type { GenerateDocumentDeps, GenerateDocumentResult } from './usecases/generate-document.js';
export { generateDocument } from './usecases/generate-document.js';
