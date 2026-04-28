import type { Settings } from '../domain/settings.js';

export interface SettingsStoragePort {
  load(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}
