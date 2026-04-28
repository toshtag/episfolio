import { describe, expect, it } from 'vitest';
import type { SettingsStoragePort } from '../../src/ports/settings-storage-port.js';
import { DEFAULT_SETTINGS, type Settings } from '../../src/domain/settings.js';

class InMemorySettingsStorage implements SettingsStoragePort {
  private data: Settings = { ...DEFAULT_SETTINGS };

  async load(): Promise<Settings> {
    return { ...this.data };
  }

  async save(settings: Settings): Promise<void> {
    this.data = { ...settings };
  }
}

describe('SettingsStoragePort contract', () => {
  it('load returns default settings initially', async () => {
    const storage: SettingsStoragePort = new InMemorySettingsStorage();
    const settings = await storage.load();
    expect(settings.aiProvider).toBe('openai');
    expect(settings.openaiModel).toBe('gpt-4o-mini');
    expect(settings.defaultRemoteLLMAllowed).toBe(true);
  });

  it('save persists settings and load retrieves them', async () => {
    const storage: SettingsStoragePort = new InMemorySettingsStorage();
    const updated: Settings = {
      aiProvider: 'openai',
      openaiModel: 'gpt-4o',
      defaultRemoteLLMAllowed: false,
    };
    await storage.save(updated);
    const loaded = await storage.load();
    expect(loaded.openaiModel).toBe('gpt-4o');
    expect(loaded.defaultRemoteLLMAllowed).toBe(false);
  });

  it('load returns a copy (mutation does not affect stored state)', async () => {
    const storage: SettingsStoragePort = new InMemorySettingsStorage();
    const s = await storage.load();
    s.openaiModel = 'tampered';
    const s2 = await storage.load();
    expect(s2.openaiModel).toBe(DEFAULT_SETTINGS.openaiModel);
  });
});
