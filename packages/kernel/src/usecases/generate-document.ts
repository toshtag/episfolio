import {
  type GenerateDocumentInput,
  type GenerateDocumentOutput,
  GenerateDocumentOutputSchema,
} from '../contracts/generate-document.js';
import type { AIRun } from '../domain/ai-run.js';
import type { CareerDocument, DocumentRevision } from '../domain/career-document.js';
import type { ISO8601, ULID } from '../domain/episode.js';
import type { SkillEvidence } from '../domain/skill-evidence.js';
import type { AIProviderPort } from '../ports/ai-provider-port.js';
import type { AIRunStoragePort } from '../ports/ai-run-storage-port.js';
import type { CareerDocumentStoragePort } from '../ports/career-document-storage-port.js';
import type { DocumentRevisionStoragePort } from '../ports/document-revision-storage-port.js';
import { PROMPT_ID, PROMPT_TEMPLATE, PROMPT_VERSION } from '../prompts/generate-document-v1.js';

export type GenerateDocumentDeps = {
  aiProvider: AIProviderPort;
  documentStorage: CareerDocumentStoragePort;
  revisionStorage: DocumentRevisionStoragePort;
  aiRunStorage: AIRunStoragePort;
  idGen: () => ULID;
  clock: () => ISO8601;
  hashFn: (text: string) => Promise<string>;
};

export type GenerateDocumentResult = {
  document: CareerDocument;
  revision: DocumentRevision;
};

function formatEvidences(evidences: SkillEvidence[]): string {
  return evidences
    .map(
      (ev, i) => `### エビデンス ${i + 1}: ${ev.strengthLabel} (ID: ${ev.id})

説明: ${ev.description}
再現性: ${ev.reproducibility}
評価文脈: ${ev.evaluatedContext}
確信度: ${ev.confidence}`,
    )
    .join('\n\n---\n\n');
}

function buildPrompt(evidences: SkillEvidence[], jobTarget: string): GenerateDocumentInput {
  const evidencesText = evidences.length > 0 ? formatEvidences(evidences) : '（エビデンスなし）';
  const systemPrompt = PROMPT_TEMPLATE.replace('{{evidenceCount}}', String(evidences.length))
    .replace('{{jobTarget}}', jobTarget)
    .replace('{{evidences}}', evidencesText);
  return {
    systemPrompt,
    userPrompt: `上記 ${evidences.length} 件のエビデンスをもとに、「${jobTarget}」向けの職務経歴書強みセクションを生成してください。`,
  };
}

export async function generateDocument(
  evidences: SkillEvidence[],
  jobTarget: string,
  deps: GenerateDocumentDeps,
): Promise<GenerateDocumentResult> {
  const now = deps.clock();
  const documentId = deps.idGen();

  if (evidences.length === 0) {
    const emptyDoc: CareerDocument = {
      id: documentId,
      title: `${jobTarget} 職務経歴書`,
      jobTarget,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    const emptyRevision: DocumentRevision = {
      id: deps.idGen(),
      documentId,
      content: '',
      sourceEvidenceIds: [],
      sourceAIRunId: null,
      createdBy: 'ai',
      createdAt: now,
    };
    const savedDoc = await deps.documentStorage.save(emptyDoc);
    const savedRevision = await deps.revisionStorage.save(emptyRevision);
    return { document: savedDoc, revision: savedRevision };
  }

  const promptHash = await deps.hashFn(PROMPT_TEMPLATE);
  const inputs = buildPrompt(evidences, jobTarget);

  const response = await deps.aiProvider.generate<GenerateDocumentInput, GenerateDocumentOutput>({
    promptId: PROMPT_ID,
    promptVersion: PROMPT_VERSION,
    promptHash,
    inputs,
    outputSchema: GenerateDocumentOutputSchema,
  });

  const aiRun: AIRun = {
    id: deps.idGen(),
    provider: deps.aiProvider.config.id,
    model: response.modelUsed,
    purpose: 'generate_document',
    promptId: PROMPT_ID,
    promptVersion: PROMPT_VERSION,
    promptHash,
    modelParams: null,
    inputSnapshotMode: 'references_only',
    inputSnapshot: null,
    inputReferences: { evidenceIds: evidences.map((ev) => ev.id) },
    outputRaw: response.raw,
    outputParsed: response.parsed,
    parseError: response.parseError,
    tokenUsage: response.usage,
    costEstimateUSD: response.costEstimateUSD,
    createdAt: now,
  };

  const savedRun = await deps.aiRunStorage.save(aiRun);

  const content =
    response.parseError !== null || response.parsed === null ? '' : buildMarkdown(response.parsed);

  const document: CareerDocument = {
    id: documentId,
    title: `${jobTarget} 職務経歴書`,
    jobTarget,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  const revision: DocumentRevision = {
    id: deps.idGen(),
    documentId,
    content,
    sourceEvidenceIds: evidences.map((ev) => ev.id),
    sourceAIRunId: savedRun.id,
    createdBy: 'ai',
    createdAt: now,
  };

  const savedDoc = await deps.documentStorage.save(document);
  const savedRevision = await deps.revisionStorage.save(revision);
  return { document: savedDoc, revision: savedRevision };
}

function buildMarkdown(output: GenerateDocumentOutput): string {
  const sections = output.sections.map((s) => `## ${s.heading}\n\n${s.body}`).join('\n\n');
  return `${sections}\n\n---\n\n${output.summary}`;
}
