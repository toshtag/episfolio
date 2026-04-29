import type { ZodType } from 'zod';

export type ProviderCapabilities = {
  structuredOutput: boolean;
  streaming: boolean;
  maxContextTokens: number;
  costPer1kInput: number | null;
  costPer1kOutput: number | null;
};

export type ProviderConfig = {
  id: string;
  name: string;
  privacyLevel: 'local' | 'remote';
  baseUrl?: string;
  defaultModel: string;
  capabilities: ProviderCapabilities;
};

export type AIRequest<TIn, TOut> = {
  promptId: string;
  promptVersion: string;
  promptHash: string;
  inputs: TIn;
  outputSchema: ZodType<TOut>;
  modelOverride?: string;
  modelParams?: { temperature?: number; topP?: number; seed?: number };
};

export type AIResponse<TOut> = {
  parsed: TOut;
  raw: string;
  parseError: string | null;
  usage: { input: number; output: number; total: number } | null;
  costEstimateUSD: number | null;
  modelUsed: string;
};

export interface AIProviderPort {
  readonly config: ProviderConfig;
  generate<TIn, TOut>(req: AIRequest<TIn, TOut>): Promise<AIResponse<TOut>>;
  testConnection(): Promise<void>;
}
