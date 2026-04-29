import { describe, expect, it, vi } from 'vitest';
import { generateDocument } from '../../src/usecases/generate-document.js';
import type { GenerateDocumentDeps } from '../../src/usecases/generate-document.js';
import type { AIProviderPort, AIRequest, AIResponse, ProviderConfig } from '../../src/ports/ai-provider-port.js';
import type { CareerDocumentStoragePort } from '../../src/ports/career-document-storage-port.js';
import type { DocumentRevisionStoragePort } from '../../src/ports/document-revision-storage-port.js';
import type { AIRunStoragePort } from '../../src/ports/ai-run-storage-port.js';
import type { SkillEvidence } from '../../src/domain/skill-evidence.js';
import type { CareerDocument, DocumentRevision } from '../../src/domain/career-document.js';
import type { AIRun } from '../../src/domain/ai-run.js';
import type { GenerateDocumentOutput } from '../../src/contracts/generate-document.js';

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

const makeEvidence = (overrides: Partial<SkillEvidence> = {}): SkillEvidence => ({
  id: '01EVIDENCE0001',
  strengthLabel: '課題解決力',
  description: '複雑な問題を分解して解決できる。',
  evidenceEpisodeIds: ['01EP0001'],
  reproducibility: '様々な状況で再現できる。',
  evaluatedContext: 'マネージャーに評価された。',
  confidence: 'high',
  status: 'accepted',
  createdBy: 'ai',
  sourceAIRunId: null,
  createdAt: '2026-04-29T00:00:00Z',
  updatedAt: '2026-04-29T00:00:00Z',
  ...overrides,
});

const mockOutput: GenerateDocumentOutput = {
  sections: [
    {
      heading: '課題解決力',
      body: '複雑な課題を構造的に分解し、着実に解決します。',
      evidenceIds: ['01EVIDENCE0001'],
    },
  ],
  summary: '論理的思考と行動力を兼ね備えた人材です。',
};

function makeDeps(): GenerateDocumentDeps {
  let idCounter = 0;

  const aiProvider: AIProviderPort = {
    config: remoteConfig,
    generate: vi.fn().mockImplementation(async <TIn, TOut>(req: AIRequest<TIn, TOut>): Promise<AIResponse<TOut>> => {
      const raw = JSON.stringify(mockOutput);
      const parsed = req.outputSchema.parse(mockOutput) as TOut;
      return {
        parsed,
        raw,
        parseError: null,
        usage: { input: 200, output: 100, total: 300 },
        costEstimateUSD: 0.00004,
        modelUsed: remoteConfig.defaultModel,
      };
    }),
    testConnection: vi.fn(),
  };

  const documentStorage: CareerDocumentStoragePort = {
    save: vi.fn().mockImplementation(async (doc: CareerDocument) => doc),
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn(),
  };

  const revisionStorage: DocumentRevisionStoragePort = {
    save: vi.fn().mockImplementation(async (rev: DocumentRevision) => rev),
    listByDocument: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
  };

  const aiRunStorage: AIRunStoragePort = {
    save: vi.fn().mockImplementation(async (run: AIRun) => ({ ...run, id: 'run-id-001' })),
    get: vi.fn().mockResolvedValue(null),
    listByPurpose: vi.fn().mockResolvedValue([]),
  };

  return {
    aiProvider,
    documentStorage,
    revisionStorage,
    aiRunStorage,
    idGen: () => `id-${++idCounter}` as ReturnType<() => string>,
    clock: () => '2026-04-29T00:00:00Z',
    hashFn: vi.fn().mockResolvedValue('mock-hash'),
  };
}

describe('generateDocument usecase', () => {
  it('evidences が空のとき空コンテンツのドキュメントを返し AI を呼ばない', async () => {
    const deps = makeDeps();
    const result = await generateDocument([], 'バックエンドエンジニア', deps);

    expect(result.document.jobTarget).toBe('バックエンドエンジニア');
    expect(result.document.status).toBe('draft');
    expect(result.revision.content).toBe('');
    expect(result.revision.sourceEvidenceIds).toEqual([]);
    expect(result.revision.sourceAIRunId).toBeNull();
    expect(deps.aiProvider.generate).not.toHaveBeenCalled();
    expect(deps.documentStorage.save).toHaveBeenCalledOnce();
    expect(deps.revisionStorage.save).toHaveBeenCalledOnce();
  });

  it('正常系: AI 出力を Markdown に変換しドキュメント・リビジョンを保存する', async () => {
    const deps = makeDeps();
    const evidences = [makeEvidence()];
    const result = await generateDocument(evidences, 'バックエンドエンジニア', deps);

    expect(result.document.jobTarget).toBe('バックエンドエンジニア');
    expect(result.document.status).toBe('draft');
    expect(result.revision.content).toContain('## 課題解決力');
    expect(result.revision.content).toContain('論理的思考と行動力');
    expect(result.revision.sourceEvidenceIds).toEqual(['01EVIDENCE0001']);
    expect(result.revision.sourceAIRunId).toBe('run-id-001');
    expect(result.revision.createdBy).toBe('ai');
    expect(deps.aiProvider.generate).toHaveBeenCalledOnce();
    expect(deps.aiRunStorage.save).toHaveBeenCalledOnce();
    expect(deps.documentStorage.save).toHaveBeenCalledOnce();
    expect(deps.revisionStorage.save).toHaveBeenCalledOnce();
  });

  it('AIRun に promptId・promptVersion・promptHash・purpose が記録される', async () => {
    const deps = makeDeps();
    await generateDocument([makeEvidence()], 'PM', deps);

    const savedRun = (deps.aiRunStorage.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AIRun;
    expect(savedRun.promptId).toBe('generate-document-v1');
    expect(savedRun.promptVersion).toBe('1.0.0');
    expect(savedRun.promptHash).toBe('mock-hash');
    expect(savedRun.purpose).toBe('generate_document');
    expect(savedRun.inputReferences?.evidenceIds).toEqual(['01EVIDENCE0001']);
  });

  it('parse エラー時は空コンテンツのリビジョンを返し AIRun は保存する', async () => {
    const deps = makeDeps();
    const aiProvider: AIProviderPort = {
      config: remoteConfig,
      generate: vi.fn().mockResolvedValue({
        parsed: null,
        raw: 'invalid',
        parseError: 'unexpected token',
        usage: null,
        costEstimateUSD: null,
        modelUsed: 'gpt-4o-mini',
      }),
      testConnection: vi.fn(),
    };
    deps.aiProvider = aiProvider;

    const result = await generateDocument([makeEvidence()], 'PM', deps);
    expect(result.revision.content).toBe('');
    expect(deps.aiRunStorage.save).toHaveBeenCalledOnce();
    const savedRun = (deps.aiRunStorage.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AIRun;
    expect(savedRun.parseError).toBe('unexpected token');
  });

  it('ドキュメントタイトルに jobTarget が含まれる', async () => {
    const deps = makeDeps();
    const result = await generateDocument([], 'データエンジニア', deps);
    expect(result.document.title).toContain('データエンジニア');
  });

  it('複数エビデンスの ID が sourceEvidenceIds に全て含まれる', async () => {
    const deps = makeDeps();
    const ev1 = makeEvidence({ id: 'EV001' });
    const ev2 = makeEvidence({ id: 'EV002', strengthLabel: 'リーダーシップ' });
    const result = await generateDocument([ev1, ev2], 'PM', deps);
    expect(result.revision.sourceEvidenceIds).toEqual(['EV001', 'EV002']);
  });
});
