import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type {
  AIProviderPort,
  AIRequest,
  AIResponse,
  ProviderConfig,
} from '../../src/ports/ai-provider-port.js';

const remoteConfig: ProviderConfig = {
  id: 'openai',
  name: 'OpenAI',
  privacyLevel: 'remote',
  defaultModel: 'gpt-4o-mini',
  capabilities: {
    structuredOutput: true,
    streaming: false,
    maxContextTokens: 128_000,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
};

class MockAIProvider implements AIProviderPort {
  readonly config: ProviderConfig = remoteConfig;

  async generate<TIn, TOut>(req: AIRequest<TIn, TOut>): Promise<AIResponse<TOut>> {
    const raw = JSON.stringify({ mock: true, promptId: req.promptId });
    const parsed = req.outputSchema.parse({ mock: true, promptId: req.promptId });
    return {
      parsed,
      raw,
      parseError: null,
      usage: { input: 10, output: 5, total: 15 },
      costEstimateUSD: 0.000003,
      modelUsed: this.config.defaultModel,
    };
  }

  async testConnection(): Promise<void> {
    // no-op: connection OK
  }
}

describe('AIProviderPort contract', () => {
  const provider: AIProviderPort = new MockAIProvider();

  it('config には privacyLevel が含まれる', () => {
    expect(provider.config.privacyLevel).toBe('remote');
    expect(provider.config.id).toBe('openai');
  });

  it('generate は parsed・raw・usage・modelUsed を返す', async () => {
    const schema = z.object({ mock: z.boolean(), promptId: z.string() });
    const req: AIRequest<{ text: string }, z.infer<typeof schema>> = {
      promptId: 'test-prompt-v1',
      promptVersion: '1.0.0',
      promptHash: 'abc123',
      inputs: { text: 'こんにちは' },
      outputSchema: schema,
    };
    const result = await provider.generate(req);
    expect(result.parsed.mock).toBe(true);
    expect(result.parsed.promptId).toBe('test-prompt-v1');
    expect(result.raw).toContain('test-prompt-v1');
    expect(result.usage?.total).toBe(15);
    expect(result.modelUsed).toBe('gpt-4o-mini');
    expect(result.parseError).toBeNull();
  });

  it('testConnection は正常終了する', async () => {
    await expect(provider.testConnection()).resolves.toBeUndefined();
  });

  it('testConnection が失敗したとき reject する', async () => {
    const broken: AIProviderPort = {
      config: remoteConfig,
      generate: vi.fn(),
      testConnection: vi.fn().mockRejectedValue(new Error('401 Unauthorized')),
    };
    await expect(broken.testConnection()).rejects.toThrow('401 Unauthorized');
  });
});
