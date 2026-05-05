import { beforeEach, describe, expect, it } from 'vitest';
import type { LifeTimelineEntry } from '../../src/domain/life-timeline-entry.js';
import type { LifeTimelineStoragePort } from '../../src/ports/life-timeline-storage-port.js';
import type { LifeTimelineEntryUpdate } from '../../src/schemas/life-timeline-entry.js';

class InMemoryLifeTimelineStorage implements LifeTimelineStoragePort {
  private store = new Map<string, LifeTimelineEntry>();

  async create(entry: LifeTimelineEntry): Promise<LifeTimelineEntry> {
    this.store.set(entry.id, entry);
    return entry;
  }

  async list(): Promise<LifeTimelineEntry[]> {
    return Array.from(this.store.values()).sort((a, b) => a.ageRangeStart - b.ageRangeStart);
  }

  async get(id: string): Promise<LifeTimelineEntry | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: LifeTimelineEntryUpdate): Promise<LifeTimelineEntry> {
    const current = this.store.get(id);
    if (!current) throw new Error(`LifeTimelineEntry not found: ${id}`);
    const updated: LifeTimelineEntry = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: '2026-04-29T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`LifeTimelineEntry not found: ${id}`);
    this.store.delete(id);
  }
}

const buildEntry = (id: string, overrides: Partial<LifeTimelineEntry> = {}): LifeTimelineEntry => ({
  id,
  ageRangeStart: 22,
  ageRangeEnd: 24,
  yearStart: 2010,
  yearEnd: 2012,
  category: 'work',
  summary: '新卒で入社、プロダクト開発を担当',
  detail: '',
  tags: [],
  createdAt: '2026-04-29T00:00:00Z',
  updatedAt: '2026-04-29T00:00:00Z',
  ...overrides,
});

describe('LifeTimelineStoragePort contract', () => {
  let storage: LifeTimelineStoragePort;

  beforeEach(() => {
    storage = new InMemoryLifeTimelineStorage();
  });

  describe('create / get', () => {
    it('作成したエントリを get で取得できる', async () => {
      const entry = buildEntry('01AAAA');
      await storage.create(entry);
      const found = await storage.get('01AAAA');
      expect(found).toEqual(entry);
    });

    it('存在しない id で null を返す', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('年齢昇順で返す', async () => {
      await storage.create(buildEntry('01BBBB', { ageRangeStart: 30 }));
      await storage.create(buildEntry('01AAAA', { ageRangeStart: 18 }));
      const list = await storage.list();
      expect(list.map((e) => e.id)).toEqual(['01AAAA', '01BBBB']);
    });
  });

  describe('update', () => {
    it('指定したフィールドだけが更新される', async () => {
      const entry = buildEntry('01CCCC', { summary: '元の概要', category: 'work' });
      await storage.create(entry);
      const updated = await storage.update('01CCCC', { summary: '更新後の概要' });
      expect(updated.summary).toBe('更新後の概要');
      expect(updated.category).toBe('work');
    });

    it('id と createdAt は保持される', async () => {
      const entry = buildEntry('01DDDD', { createdAt: '2026-01-01T00:00:00Z' });
      await storage.create(entry);
      const updated = await storage.update('01DDDD', { summary: '更新' });
      expect(updated.id).toBe('01DDDD');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が変わる', async () => {
      const entry = buildEntry('01EEEE', { updatedAt: '2026-01-01T00:00:00Z' });
      await storage.create(entry);
      const updated = await storage.update('01EEEE', { summary: '更新' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id でエラーになる', async () => {
      await expect(storage.update('not-found', { summary: '更新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null が返る', async () => {
      await storage.create(buildEntry('01FFFF'));
      await storage.delete('01FFFF');
      expect(await storage.get('01FFFF')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildEntry('01GGGG', { ageRangeStart: 20 }));
      await storage.create(buildEntry('01HHHH', { ageRangeStart: 25 }));
      await storage.delete('01GGGG');
      const list = await storage.list();
      expect(list.map((e) => e.id)).toEqual(['01HHHH']);
    });

    it('存在しない id でエラーになる', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
