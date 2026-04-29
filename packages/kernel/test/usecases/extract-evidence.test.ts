import { describe, expect, it, vi } from 'vitest';
import type { ExtractEvidenceOutputSchema } from '../../src/contracts/extract-evidence.js';
import type { AIRun } from '../../src/domain/ai-run.js';
import type { Episode } from '../../src/domain/episode.js';
import type { SkillEvidence } from '../../src/domain/skill-evidence.js';
import { RemoteLLMBlockedError } from '../../src/errors.js';
import type {
  AIProviderPort,
  AIRequest,
  AIResponse,
  ProviderConfig,
} from '../../src/ports/ai-provider-port.js';
import type { AIRunStoragePort } from '../../src/ports/ai-run-storage-port.js';
import type { SkillEvidenceStoragePort } from '../../src/ports/skill-evidence-storage-port.js';
import type { ExtractEvidenceDeps } from '../../src/usecases/extract-evidence.js';
import { extractEvidence } from '../../src/usecases/extract-evidence.js';

const remoteConfig: ProviderConfig = {
  id: 'openai',
  name: 'OpenAI',
  privacyLevel: 'remote',
  defaultModel: 'gpt-4o-mini',
  capabilities: {
    structuredOutput: true,
    streaming: false,
    maxContextTokens: 128_000,
    costPer1kInput: null,
    costPer1kOutput: null,
  },
};

const localConfig: ProviderConfig = {
  ...remoteConfig,
  id: 'ollama',
  name: 'Ollama',
  privacyLevel: 'local',
};

const makeEpisode = (overrides: Partial<Episode> = {}): Episode => ({
  id: '01JQZB3K2MXNV8P4RY5T6W7F9A',
  title: 'テストエピソード',
  background: '背景',
  problem: '課題',
  action: '行動',
  ingenuity: '工夫',
  result: '結果',
  metrics: '指標',
  beforeAfter: '前後',
  reproducibility: '再現性',
  relatedSkills: [],
  personalFeeling: '',
  externalFeedback: '称賛された',
  remoteLLMAllowed: true,
  tags: [],
  createdAt: '2026-04-29T00:00:00Z',
  updatedAt: '2026-04-29T00:00:00Z',
  ...overrides,
});

const mockOutput = {
  candidates: [
    {
      strengthLabel: '課題解決力',
      description: '複雑な問題を分解して解決できる。',
      evidenceEpisodeIds: ['01JQZB3K2MXNV8P4RY5T6W7F9A'],
      reproducibility: '様々な状況で再現できる。',
      evaluatedContext: 'マネージャーに評価された。',
      confidence: 'high' as const,
    },
  ],
};

function makeDeps(providerConfig: ProviderConfig = remoteConfig): ExtractEvidenceDeps {
  let idCounter = 0;
  const savedRun: AIRun = {
    id: 'run-id-001',
    provider: providerConfig.id,
    model: providerConfig.defaultModel,
    purpose: 'extract_evidence',
    promptId: 'extract-evidence-v1',
    promptVersion: '1.0.0',
    promptHash: 'mock-hash',
    modelParams: null,
    inputSnapshotMode: 'references_only',
    inputSnapshot: null,
    inputReferences: null,
    outputRaw: '',
    outputParsed: null,
    parseError: null,
    tokenUsage: null,
    costEstimateUSD: null,
    createdAt: '2026-04-29T00:00:00Z',
  };

  const aiProvider: AIProviderPort = {
    config: providerConfig,
    generate: vi
      .fn()
      .mockImplementation(
        async <TIn, TOut>(req: AIRequest<TIn, TOut>): Promise<AIResponse<TOut>> => {
          const raw = JSON.stringify(mockOutput);
          const parsed = req.outputSchema.parse(mockOutput) as TOut;
          return {
            parsed,
            raw,
            parseError: null,
            usage: { input: 100, output: 50, total: 150 },
            costEstimateUSD: 0.00002,
            modelUsed: providerConfig.defaultModel,
          };
        },
      ),
    testConnection: vi.fn(),
  };

  const aiRunStorage: AIRunStoragePort = {
    save: vi.fn().mockImplementation(async (run: AIRun) => ({ ...run, id: 'run-id-001' })),
    get: vi.fn().mockResolvedValue(savedRun),
    listByPurpose: vi.fn().mockResolvedValue([]),
  };

  const evidenceStorage: SkillEvidenceStoragePort = {
    save: vi.fn().mockImplementation(async (e: SkillEvidence) => e),
    saveMany: vi.fn().mockImplementation(async (es: SkillEvidence[]) => es),
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn(),
  };

  return {
    aiProvider,
    aiRunStorage,
    evidenceStorage,
    idGen: () => `id-${++idCounter}`,
    clock: () => '2026-04-29T00:00:00Z',
    hashFn: vi.fn().mockResolvedValue('mock-hash'),
  };
}

describe('extractEvidence usecase', () => {
  it('episodes が空のとき空配列を返す', async () => {
    const deps = makeDeps();
    const result = await extractEvidence([], deps);
    expect(result).toEqual([]);
    expect(deps.aiProvider.generate).not.toHaveBeenCalled();
  });

  it('正常系: AI 候補を SkillEvidence として保存・返す', async () => {
    const deps = makeDeps();
    const episodes = [makeEpisode()];
    const result = await extractEvidence(episodes, deps);

    expect(result).toHaveLength(1);
    expect(result[0].strengthLabel).toBe('課題解決力');
    expect(result[0].status).toBe('candidate');
    expect(result[0].createdBy).toBe('ai');
    expect(result[0].sourceAIRunId).toBe('run-id-001');
    expect(deps.evidenceStorage.saveMany).toHaveBeenCalledOnce();
    expect(deps.aiRunStorage.save).toHaveBeenCalledOnce();
  });

  it('AIRun に promptId・promptVersion・promptHash が記録される', async () => {
    const deps = makeDeps();
    await extractEvidence([makeEpisode()], deps);

    const savedRun = (deps.aiRunStorage.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AIRun;
    expect(savedRun.promptId).toBe('extract-evidence-v1');
    expect(savedRun.promptVersion).toBe('1.0.0');
    expect(savedRun.promptHash).toBe('mock-hash');
    expect(savedRun.purpose).toBe('extract_evidence');
    expect(savedRun.inputReferences?.episodeIds).toEqual([makeEpisode().id]);
  });

  it('remote provider に remoteLLMAllowed=false のエピソードを渡すと RemoteLLMBlockedError をスローする', async () => {
    const deps = makeDeps(remoteConfig);
    const blockedEpisode = makeEpisode({ id: 'blocked-001', remoteLLMAllowed: false });

    await expect(extractEvidence([blockedEpisode], deps)).rejects.toThrow(RemoteLLMBlockedError);
    expect(deps.aiProvider.generate).not.toHaveBeenCalled();
  });

  it('RemoteLLMBlockedError は blocked エピソードの ID を含む', async () => {
    const deps = makeDeps(remoteConfig);
    const blocked = makeEpisode({ id: 'blocked-001', remoteLLMAllowed: false });
    const allowed = makeEpisode({ id: 'allowed-001', remoteLLMAllowed: true });

    let caught: RemoteLLMBlockedError | undefined;
    try {
      await extractEvidence([allowed, blocked], deps);
    } catch (e) {
      if (e instanceof RemoteLLMBlockedError) caught = e;
    }

    expect(caught).toBeInstanceOf(RemoteLLMBlockedError);
    expect(caught?.blockedEpisodeIds).toContain('blocked-001');
    expect(caught?.blockedEpisodeIds).not.toContain('allowed-001');
  });

  it('local provider は remoteLLMAllowed=false でもブロックしない', async () => {
    const deps = makeDeps(localConfig);
    const episodes = [makeEpisode({ remoteLLMAllowed: false })];

    const result = await extractEvidence(episodes, deps);
    expect(result).toHaveLength(1);
    expect(deps.aiProvider.generate).toHaveBeenCalledOnce();
  });

  it('parse エラー時は空配列を返し AIRun を保存する', async () => {
    const deps = makeDeps();
    const aiProvider: AIProviderPort = {
      config: remoteConfig,
      generate: vi.fn().mockResolvedValue({
        parsed: null as unknown as typeof ExtractEvidenceOutputSchema._type,
        raw: 'invalid json',
        parseError: 'unexpected token',
        usage: null,
        costEstimateUSD: null,
        modelUsed: 'gpt-4o-mini',
      }),
      testConnection: vi.fn(),
    };
    deps.aiProvider = aiProvider;

    const result = await extractEvidence([makeEpisode()], deps);
    expect(result).toEqual([]);
    expect(deps.aiRunStorage.save).toHaveBeenCalledOnce();
    const savedRun = (deps.aiRunStorage.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AIRun;
    expect(savedRun.parseError).toBe('unexpected token');
  });
});
