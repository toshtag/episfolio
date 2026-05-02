import { beforeEach, describe, expect, it } from 'vitest';
import type { WorkAssetSummary } from '../../src/domain/work-asset-summary.js';
import type { WorkAssetSummaryStoragePort } from '../../src/ports/work-asset-summary-storage-port.js';
import type { WorkAssetSummaryUpdate } from '../../src/schemas/work-asset-summary.js';

class InMemoryWorkAssetSummaryStorage implements WorkAssetSummaryStoragePort {
  private store = new Map<string, WorkAssetSummary>();

  async create(asset: WorkAssetSummary): Promise<WorkAssetSummary> {
    this.store.set(asset.id, asset);
    return asset;
  }

  async list(): Promise<WorkAssetSummary[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<WorkAssetSummary | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: WorkAssetSummaryUpdate): Promise<WorkAssetSummary> {
    const current = this.store.get(id);
    if (!current) throw new Error(`WorkAssetSummary not found: ${id}`);
    const updated: WorkAssetSummary = {
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
    if (!this.store.has(id)) throw new Error(`WorkAssetSummary not found: ${id}`);
    this.store.delete(id);
  }
}

const buildAsset = (
  id: string,
  overrides: Partial<WorkAssetSummary> = {},
): WorkAssetSummary => ({
  id,
  title: '新規顧客向け提案書',
  assetType: 'proposal',
  jobContext: null,
  period: null,
  role: null,
  summary: null,
  strengthEpisode: null,
  talkingPoints: null,
  maskingNote: null,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
  ...overrides,
});

describe('WorkAssetSummaryStoragePort contract', () => {
  let storage: WorkAssetSummaryStoragePort;

  beforeEach(() => {
    storage = new InMemoryWorkAssetSummaryStorage();
  });

  describe('create / get', () => {
    it('create した WorkAssetSummary を get で取得できる', async () => {
      const asset = buildAsset('01HASSET1');
      await storage.create(asset);
      expect(await storage.get('01HASSET1')).toEqual(asset);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('作成済みの全件を createdAt 昇順で返す', async () => {
      await storage.create(buildAsset('01HASSET2', { createdAt: '2026-05-02T01:00:00Z' }));
      await storage.create(buildAsset('01HASSET1', { createdAt: '2026-05-01T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((a) => a.id)).toEqual(['01HASSET1', '01HASSET2']);
    });

    it('データがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });

    it('複数の assetType が混在しても全件返す', async () => {
      await storage.create(buildAsset('01HASSET1', { assetType: 'proposal' }));
      await storage.create(
        buildAsset('01HASSET2', { assetType: 'slide', createdAt: '2026-05-02T01:00:00Z' }),
      );
      const list = await storage.list();
      expect(list.map((a) => a.assetType).sort()).toEqual(['proposal', 'slide']);
    });
  });

  describe('update', () => {
    it('title を patch で更新できる', async () => {
      await storage.create(buildAsset('01HASSET1', { title: '旧タイトル' }));
      const updated = await storage.update('01HASSET1', { title: '新タイトル' });
      expect(updated.title).toBe('新タイトル');
    });

    it('assetType を proposal から slide に変更できる', async () => {
      await storage.create(buildAsset('01HASSET1', { assetType: 'proposal' }));
      const updated = await storage.update('01HASSET1', { assetType: 'slide' });
      expect(updated.assetType).toBe('slide');
    });

    it('summary を null から文字列に更新できる', async () => {
      await storage.create(buildAsset('01HASSET1', { summary: null }));
      const updated = await storage.update('01HASSET1', { summary: '課題整理と試算' });
      expect(updated.summary).toBe('課題整理と試算');
    });

    it('talkingPoints を文字列から null に更新できる', async () => {
      await storage.create(buildAsset('01HASSET1', { talkingPoints: '提案スピード' }));
      const updated = await storage.update('01HASSET1', { talkingPoints: null });
      expect(updated.talkingPoints).toBeNull();
    });

    it('strengthEpisode と maskingNote を同時に更新できる', async () => {
      await storage.create(buildAsset('01HASSET1'));
      const updated = await storage.update('01HASSET1', {
        strengthEpisode: '3 週間で受注',
        maskingNote: '顧客名は伏字',
      });
      expect(updated.strengthEpisode).toBe('3 週間で受注');
      expect(updated.maskingNote).toBe('顧客名は伏字');
    });

    it('id / createdAt は不可変', async () => {
      await storage.create(buildAsset('01HASSET1', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HASSET1', { title: '新タイトル' });
      expect(updated.id).toBe('01HASSET1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildAsset('01HASSET1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HASSET1', { title: '新タイトル' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { title: '新タイトル' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildAsset('01HASSET1'));
      await storage.delete('01HASSET1');
      expect(await storage.get('01HASSET1')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildAsset('01HASSET1'));
      await storage.create(buildAsset('01HASSET2'));
      await storage.delete('01HASSET1');
      const list = await storage.list();
      expect(list.map((a) => a.id)).toEqual(['01HASSET2']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
