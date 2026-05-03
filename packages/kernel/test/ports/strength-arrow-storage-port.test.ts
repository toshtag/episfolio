import { beforeEach, describe, expect, it } from 'vitest';
import type { StrengthArrow, StrengthArrowType } from '../../src/domain/strength-arrow.js';
import type { StrengthArrowStoragePort } from '../../src/ports/strength-arrow-storage-port.js';
import type { StrengthArrowUpdate } from '../../src/schemas/strength-arrow.js';

class InMemoryStrengthArrowStorage implements StrengthArrowStoragePort {
  private store = new Map<string, StrengthArrow>();

  async create(arrow: StrengthArrow): Promise<StrengthArrow> {
    this.store.set(arrow.id, arrow);
    return arrow;
  }

  async list(): Promise<StrengthArrow[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listByType(type: StrengthArrowType): Promise<StrengthArrow[]> {
    return Array.from(this.store.values())
      .filter((a) => a.type === type)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<StrengthArrow | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: StrengthArrowUpdate): Promise<StrengthArrow> {
    const current = this.store.get(id);
    if (!current) throw new Error(`StrengthArrow not found: ${id}`);
    const updated: StrengthArrow = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: '2026-05-03T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`StrengthArrow not found: ${id}`);
    this.store.delete(id);
  }
}

const buildArrow = (id: string, overrides: Partial<StrengthArrow> = {}): StrengthArrow => ({
  id,
  type: 'interest',
  description: 'なぜそんなに詳しいんですか？と聞かれた',
  source: '営業部の先輩',
  occurredAt: '2024-03-01',
  relatedEpisodeIds: [],
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('StrengthArrowStoragePort contract', () => {
  let storage: StrengthArrowStoragePort;

  beforeEach(() => {
    storage = new InMemoryStrengthArrowStorage();
  });

  describe('create / get', () => {
    it('create した矢印を get で取得できる', async () => {
      const arrow = buildArrow('01ARROW001');
      await storage.create(arrow);
      expect(await storage.get('01ARROW001')).toEqual(arrow);
    });

    it('relatedEpisodeIds が保持される', async () => {
      const arrow = buildArrow('01ARROW001', { relatedEpisodeIds: ['01EP0001', '01EP0002'] });
      await storage.create(arrow);
      const got = await storage.get('01ARROW001');
      expect(got?.relatedEpisodeIds).toEqual(['01EP0001', '01EP0002']);
    });

    it('occurredAt が null でも保存できる', async () => {
      const arrow = buildArrow('01ARROW001', { occurredAt: null });
      await storage.create(arrow);
      const got = await storage.get('01ARROW001');
      expect(got?.occurredAt).toBeNull();
    });

    it('note が null でも保存できる', async () => {
      const arrow = buildArrow('01ARROW001', { note: null });
      await storage.create(arrow);
      const got = await storage.get('01ARROW001');
      expect(got?.note).toBeNull();
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('全件を createdAt 昇順で返す', async () => {
      await storage.create(buildArrow('01ARROW002', { createdAt: '2026-05-03T01:00:00Z' }));
      await storage.create(buildArrow('01ARROW001', { createdAt: '2026-05-02T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((a) => a.id)).toEqual(['01ARROW001', '01ARROW002']);
    });

    it('データがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });
  });

  describe('listByType', () => {
    it('指定 type の矢印だけを返す', async () => {
      await storage.create(buildArrow('01ARROW001', { type: 'interest' }));
      await storage.create(buildArrow('01ARROW002', { type: 'evaluation' }));
      await storage.create(buildArrow('01ARROW003', { type: 'interest' }));

      const interests = await storage.listByType('interest');
      expect(interests.map((a) => a.id)).toEqual(['01ARROW001', '01ARROW003']);

      const evaluations = await storage.listByType('evaluation');
      expect(evaluations.map((a) => a.id)).toEqual(['01ARROW002']);
    });

    it('該当 type がない場合は空配列', async () => {
      await storage.create(buildArrow('01ARROW001', { type: 'interest' }));
      expect(await storage.listByType('request')).toEqual([]);
    });
  });

  describe('update', () => {
    it('description を patch で更新できる', async () => {
      await storage.create(buildArrow('01ARROW001', { description: '旧' }));
      const updated = await storage.update('01ARROW001', { description: '新' });
      expect(updated.description).toBe('新');
    });

    it('type を変更できる', async () => {
      await storage.create(buildArrow('01ARROW001', { type: 'interest' }));
      const updated = await storage.update('01ARROW001', { type: 'evaluation' });
      expect(updated.type).toBe('evaluation');
    });

    it('relatedEpisodeIds を更新できる', async () => {
      await storage.create(buildArrow('01ARROW001', { relatedEpisodeIds: [] }));
      const updated = await storage.update('01ARROW001', {
        relatedEpisodeIds: ['01EP0001'],
      });
      expect(updated.relatedEpisodeIds).toEqual(['01EP0001']);
    });

    it('occurredAt を null に更新できる', async () => {
      await storage.create(buildArrow('01ARROW001', { occurredAt: '2024-01-01' }));
      const updated = await storage.update('01ARROW001', { occurredAt: null });
      expect(updated.occurredAt).toBeNull();
    });

    it('note を null に更新できる', async () => {
      await storage.create(buildArrow('01ARROW001', { note: '何か' }));
      const updated = await storage.update('01ARROW001', { note: null });
      expect(updated.note).toBeNull();
    });

    it('id / createdAt は不可変', async () => {
      await storage.create(buildArrow('01ARROW001', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01ARROW001', { description: '新' });
      expect(updated.id).toBe('01ARROW001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildArrow('01ARROW001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01ARROW001', { description: '新' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { description: '新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildArrow('01ARROW001'));
      await storage.delete('01ARROW001');
      expect(await storage.get('01ARROW001')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildArrow('01ARROW001'));
      await storage.create(buildArrow('01ARROW002'));
      await storage.delete('01ARROW001');
      const list = await storage.list();
      expect(list.map((a) => a.id)).toEqual(['01ARROW002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
