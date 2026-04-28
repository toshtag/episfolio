import { describe, expect, it, vi } from 'vitest';
import type { AIProviderPort, AIGenerateOptions, AIGenerateResult } from '../../src/ports/ai-provider-port.js';

class MockAIProvider implements AIProviderPort {
  async generate(userPrompt: string, options: AIGenerateOptions): Promise<AIGenerateResult> {
    return {
      text: `mock response for: ${userPrompt} (model: ${options.model})`,
      inputTokens: 10,
      outputTokens: 5,
    };
  }

  async testConnection(): Promise<void> {
    // no-op: connection OK
  }
}

describe('AIProviderPort contract', () => {
  const provider: AIProviderPort = new MockAIProvider();

  it('generate returns text and token counts', async () => {
    const result = await provider.generate('こんにちは', { model: 'gpt-4o-mini' });
    expect(result.text).toContain('こんにちは');
    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThan(0);
  });

  it('generate passes systemPrompt option', async () => {
    const result = await provider.generate('test', {
      model: 'gpt-4o-mini',
      systemPrompt: 'You are a helper.',
    });
    expect(result.text).toBeDefined();
  });

  it('testConnection resolves without error', async () => {
    await expect(provider.testConnection()).resolves.toBeUndefined();
  });

  it('testConnection rejects when connection fails', async () => {
    const broken: AIProviderPort = {
      generate: vi.fn(),
      testConnection: vi.fn().mockRejectedValue(new Error('401 Unauthorized')),
    };
    await expect(broken.testConnection()).rejects.toThrow('401 Unauthorized');
  });
});
