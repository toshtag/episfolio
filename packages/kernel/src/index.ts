export const KERNEL_VERSION = '0.1.0';

export type { Episode, ISO8601, ULID } from './domain/episode.js';
export type { AIProvider, Settings } from './domain/settings.js';
export { DEFAULT_SETTINGS } from './domain/settings.js';
export type {
  AIGenerateOptions,
  AIGenerateResult,
  AIProviderPort,
} from './ports/ai-provider-port.js';
export type { SettingsStoragePort } from './ports/settings-storage-port.js';
export type { EpisodeStoragePort } from './ports/storage-port.js';
export type { EpisodeDraft, EpisodeInput, EpisodeUpdate } from './schemas/episode.js';
export { EpisodeDraftSchema, EpisodeSchema, EpisodeUpdateSchema } from './schemas/episode.js';
