export type AIGenerateOptions = {
  model: string;
  systemPrompt?: string;
};

export type AIGenerateResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
};

export interface AIProviderPort {
  generate(userPrompt: string, options: AIGenerateOptions): Promise<AIGenerateResult>;
  testConnection(): Promise<void>;
}
