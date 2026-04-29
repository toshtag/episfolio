import type { Episode, ULID, ISO8601 } from '../domain/episode.js';
import type { SkillEvidence } from '../domain/skill-evidence.js';
import type { AIRun } from '../domain/ai-run.js';
import type { AIProviderPort } from '../ports/ai-provider-port.js';
import type { SkillEvidenceStoragePort } from '../ports/skill-evidence-storage-port.js';
import type { AIRunStoragePort } from '../ports/ai-run-storage-port.js';
import { RemoteLLMBlockedError } from '../errors.js';
import {
  PROMPT_ID,
  PROMPT_VERSION,
  PROMPT_TEMPLATE,
} from '../prompts/extract-evidence-v1.js';
import {
  ExtractEvidenceOutputSchema,
  type ExtractEvidenceInput,
  type ExtractEvidenceOutput,
} from '../contracts/extract-evidence.js';

export type ExtractEvidenceDeps = {
  aiProvider: AIProviderPort;
  evidenceStorage: SkillEvidenceStoragePort;
  aiRunStorage: AIRunStoragePort;
  idGen: () => ULID;
  clock: () => ISO8601;
  hashFn: (text: string) => Promise<string>;
};

function formatEpisodes(episodes: Episode[]): string {
  return episodes
    .map(
      (ep, i) => `### エピソード ${i + 1}: ${ep.title} (ID: ${ep.id})

背景: ${ep.background}
課題: ${ep.problem}
行動: ${ep.action}
工夫: ${ep.ingenuity}
結果: ${ep.result}
再現性: ${ep.reproducibility}
外部評価: ${ep.externalFeedback}`,
    )
    .join('\n\n---\n\n');
}

function buildPrompt(episodes: Episode[]): ExtractEvidenceInput {
  const episodesText = formatEpisodes(episodes);
  const systemPrompt = PROMPT_TEMPLATE.replace('{{episodeCount}}', String(episodes.length)).replace(
    '{{episodes}}',
    episodesText,
  );
  return {
    systemPrompt,
    userPrompt: `上記 ${episodes.length} 件のエピソードから強みの候補を抽出してください。`,
  };
}

export async function extractEvidence(
  episodes: Episode[],
  deps: ExtractEvidenceDeps,
): Promise<SkillEvidence[]> {
  if (episodes.length === 0) {
    return [];
  }

  if (deps.aiProvider.config.privacyLevel === 'remote') {
    const blocked = episodes.filter((ep) => !ep.remoteLLMAllowed);
    if (blocked.length > 0) {
      throw new RemoteLLMBlockedError(blocked.map((ep) => ep.id));
    }
  }

  const promptHash = await deps.hashFn(PROMPT_TEMPLATE);
  const inputs = buildPrompt(episodes);

  const response = await deps.aiProvider.generate<ExtractEvidenceInput, ExtractEvidenceOutput>({
    promptId: PROMPT_ID,
    promptVersion: PROMPT_VERSION,
    promptHash,
    inputs,
    outputSchema: ExtractEvidenceOutputSchema,
  });

  const now = deps.clock();
  const aiRun: AIRun = {
    id: deps.idGen(),
    provider: deps.aiProvider.config.id,
    model: response.modelUsed,
    purpose: 'extract_evidence',
    promptId: PROMPT_ID,
    promptVersion: PROMPT_VERSION,
    promptHash,
    modelParams: null,
    inputSnapshotMode: 'references_only',
    inputSnapshot: null,
    inputReferences: { episodeIds: episodes.map((ep) => ep.id) },
    outputRaw: response.raw,
    outputParsed: response.parsed,
    parseError: response.parseError,
    tokenUsage: response.usage,
    costEstimateUSD: response.costEstimateUSD,
    createdAt: now,
  };

  const savedRun = await deps.aiRunStorage.save(aiRun);

  if (response.parseError !== null) {
    return [];
  }

  const candidates: SkillEvidence[] = response.parsed.candidates.map((c) => ({
    id: deps.idGen(),
    strengthLabel: c.strengthLabel,
    description: c.description,
    evidenceEpisodeIds: c.evidenceEpisodeIds,
    reproducibility: c.reproducibility,
    evaluatedContext: c.evaluatedContext,
    confidence: c.confidence,
    status: 'candidate' as const,
    createdBy: 'ai' as const,
    sourceAIRunId: savedRun.id,
    createdAt: now,
    updatedAt: now,
  }));

  return deps.evidenceStorage.saveMany(candidates);
}
