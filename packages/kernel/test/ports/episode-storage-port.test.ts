import { beforeEach, describe, expect, it } from 'vitest';
import type { Episode } from '../../src/domain/episode.js';
import type { EpisodeStoragePort } from '../../src/ports/storage-port.js';
import type { EpisodeUpdate } from '../../src/schemas/episode.js';

class InMemoryEpisodeStorage implements EpisodeStoragePort {
  private store = new Map<string, Episode>();

  async create(episode: Episode): Promise<Episode> {
    this.store.set(episode.id, episode);
    return episode;
  }

  async list(): Promise<Episode[]> {
    return Array.from(this.store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Episode | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: EpisodeUpdate): Promise<Episode> {
    const current = this.store.get(id);
    if (!current) {
      throw new Error(`Episode not found: ${id}`);
    }
    const updated: Episode = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: '2026-04-28T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) {
      throw new Error(`Episode not found: ${id}`);
    }
    this.store.delete(id);
  }
}

const buildEpisode = (id: string, overrides: Partial<Episode> = {}): Episode => ({
  id,
  title: 'タイトル',
  background: '',
  problem: '',
  action: '',
  ingenuity: '',
  result: '',
  metrics: '',
  beforeAfter: '',
  reproducibility: '',
  relatedSkills: [],
  personalFeeling: '',
  externalFeedback: '',
  remoteLLMAllowed: false,
  tags: [],
  createdAt: '2026-04-28T00:00:00Z',
  updatedAt: '2026-04-28T00:00:00Z',
  ...overrides,
});

describe('EpisodeStoragePort contract', () => {
  let storage: EpisodeStoragePort;

  beforeEach(() => {
    storage = new InMemoryEpisodeStorage();
  });

  describe('get', () => {
    it('存在する id で Episode を返す', async () => {
      const ep = buildEpisode('01AAAA');
      await storage.create(ep);
      const found = await storage.get('01AAAA');
      expect(found).toEqual(ep);
    });

    it('存在しない id で null を返す', async () => {
      const found = await storage.get('not-found');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('partial で指定したフィールドだけが更新される', async () => {
      const ep = buildEpisode('01BBBB', { problem: '元の課題', action: '元の行動' });
      await storage.create(ep);

      const updated = await storage.update('01BBBB', { problem: '更新後の課題' });

      expect(updated.problem).toBe('更新後の課題');
      expect(updated.action).toBe('元の行動');
    });

    it('id と createdAt は保持される', async () => {
      const ep = buildEpisode('01CCCC', { createdAt: '2026-04-01T00:00:00Z' });
      await storage.create(ep);

      const updated = await storage.update('01CCCC', { title: '更新タイトル' });

      expect(updated.id).toBe('01CCCC');
      expect(updated.createdAt).toBe('2026-04-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      const ep = buildEpisode('01DDDD', { updatedAt: '2026-04-01T00:00:00Z' });
      await storage.create(ep);

      const updated = await storage.update('01DDDD', { title: '更新' });

      expect(updated.updatedAt).not.toBe('2026-04-01T00:00:00Z');
    });

    it('存在しない id で更新するとエラーになる', async () => {
      await expect(storage.update('not-found', { title: '更新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('存在する id を削除できる', async () => {
      const ep = buildEpisode('01EEEE');
      await storage.create(ep);

      await storage.delete('01EEEE');

      const found = await storage.get('01EEEE');
      expect(found).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildEpisode('01FFFF'));
      await storage.create(buildEpisode('01GGGG'));

      await storage.delete('01FFFF');

      const all = await storage.list();
      expect(all.map((e) => e.id)).toEqual(['01GGGG']);
    });

    it('存在しない id を削除するとエラーになる', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
