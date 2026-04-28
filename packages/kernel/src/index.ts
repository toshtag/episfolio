export const KERNEL_VERSION = '0.1.0';

export type { ULID, ISO8601, Episode } from './domain/episode.js';
export { EpisodeSchema, EpisodeDraftSchema } from './schemas/episode.js';
export type { EpisodeInput, EpisodeDraft } from './schemas/episode.js';
export type { EpisodeStoragePort } from './ports/storage-port.js';
export type { AIProvider, Settings } from './domain/settings.js';
export { DEFAULT_SETTINGS } from './domain/settings.js';
export type { AIGenerateOptions, AIGenerateResult, AIProviderPort } from './ports/ai-provider-port.js';
export type { SettingsStoragePort } from './ports/settings-storage-port.js';
