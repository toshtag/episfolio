import { beforeEach, describe, expect, it } from 'vitest';
import type { BossReference } from '../../src/domain/boss-reference.js';
import type { BossReferenceStoragePort } from '../../src/ports/boss-reference-storage-port.js';
import type { BossReferenceUpdate } from '../../src/schemas/boss-reference.js';

class InMemoryBossReferenceStorage implements BossReferenceStoragePort {
  private store = new Map<string, BossReference>();

  async create(ref: BossReference): Promise<BossReference> {
    this.store.set(ref.id, ref);
    return ref;
  }

  async list(): Promise<BossReference[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<BossReference | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: BossReferenceUpdate): Promise<BossReference> {
    const current = this.store.get(id);
    if (!current) throw new Error(`BossReference not found: ${id}`);
    const updated: BossReference = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: '2026-05-02T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`BossReference not found: ${id}`);
    this.store.delete(id);
  }
}

const baseAxisValues = {
  logicVsEmotion: 2,
  resultVsProcess: 3,
  soloVsTeam: 4,
  futureVsTradition: 1,
  sharesPrivate: 5,
  teachingSkill: 2,
  listening: 3,
  busyness: 4,
};

const buildRef = (id: string, overrides: Partial<BossReference> = {}): BossReference => ({
  id,
  bossName: '田中部長',
  companyName: '株式会社サンプル',
  period: '2020年4月〜2023年3月',
  axisValues: baseAxisValues,
  q1: null,
  q2: null,
  q3: null,
  q4: null,
  q5: null,
  q6: null,
  q7: null,
  q8: null,
  q9: null,
  q10: null,
  q11: null,
  strengthEpisode: null,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
  ...overrides,
});

describe('BossReferenceStoragePort contract', () => {
  let storage: BossReferenceStoragePort;

  beforeEach(() => {
    storage = new InMemoryBossReferenceStorage();
  });

  describe('create / get', () => {
    it('create した BossReference を get で取得できる', async () => {
      const ref = buildRef('01HBOSS1');
      await storage.create(ref);
      expect(await storage.get('01HBOSS1')).toEqual(ref);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('作成済みの全件を createdAt 昇順で返す', async () => {
      await storage.create(buildRef('01HBOSS2', { createdAt: '2026-05-02T01:00:00Z' }));
      await storage.create(buildRef('01HBOSS1', { createdAt: '2026-05-01T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01HBOSS1', '01HBOSS2']);
    });

    it('データがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });
  });

  describe('update', () => {
    it('companyName を patch で更新できる', async () => {
      await storage.create(buildRef('01HBOSS1', { companyName: '旧会社' }));
      const updated = await storage.update('01HBOSS1', { companyName: '新会社' });
      expect(updated.companyName).toBe('新会社');
    });

    it('q1 を null から文字列に更新できる', async () => {
      await storage.create(buildRef('01HBOSS1', { q1: null }));
      const updated = await storage.update('01HBOSS1', { q1: '金融系のシステム開発' });
      expect(updated.q1).toBe('金融系のシステム開発');
    });

    it('q1 を文字列から null に更新できる', async () => {
      await storage.create(buildRef('01HBOSS1', { q1: '既存の回答' }));
      const updated = await storage.update('01HBOSS1', { q1: null });
      expect(updated.q1).toBeNull();
    });

    it('axisValues を更新できる', async () => {
      await storage.create(buildRef('01HBOSS1'));
      const newValues = { ...baseAxisValues, logicVsEmotion: 5 };
      const updated = await storage.update('01HBOSS1', { axisValues: newValues });
      expect(updated.axisValues.logicVsEmotion).toBe(5);
    });

    it('id / createdAt は不可変', async () => {
      await storage.create(buildRef('01HBOSS1', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HBOSS1', { companyName: '新会社' });
      expect(updated.id).toBe('01HBOSS1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRef('01HBOSS1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HBOSS1', { companyName: '新会社' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { companyName: '新会社' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRef('01HBOSS1'));
      await storage.delete('01HBOSS1');
      expect(await storage.get('01HBOSS1')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildRef('01HBOSS1'));
      await storage.create(buildRef('01HBOSS2'));
      await storage.delete('01HBOSS1');
      const list = await storage.list();
      expect(list.map((r) => r.id)).toEqual(['01HBOSS2']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
