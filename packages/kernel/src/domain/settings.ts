export type AIProvider = 'openai';

export type Settings = {
  aiProvider: AIProvider;
  openaiModel: string;
  defaultRemoteLLMAllowed: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  aiProvider: 'openai',
  openaiModel: 'gpt-4o-mini',
  defaultRemoteLLMAllowed: true,
};
