import { beforeEach, describe, expect, it } from 'vitest';
import type { SubordinateRow, SubordinateSummary } from '../../src/domain/subordinate-summary.js';
import type { SubordinateSummaryStoragePort } from '../../src/ports/subordinate-summary-storage-port.js';
import type { SubordinateSummaryUpdate } from '../../src/schemas/subordinate-summary.js';

class InMemorySubordinateSummaryStorage implements SubordinateSummaryStoragePort {
  private store = new Map<string, SubordinateSummary>();

  async create(summary: SubordinateSummary): Promise<SubordinateSummary> {
    this.store.set(summary.id, summary);
    return summary;
  }

  async list(): Promise<SubordinateSummary[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<SubordinateSummary | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: SubordinateSummaryUpdate): Promise<SubordinateSummary> {
    const current = this.store.get(id);
    if (!current) throw new Error(`SubordinateSummary not found: ${id}`);
    const updated: SubordinateSummary = {
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
    if (!this.store.has(id)) throw new Error(`SubordinateSummary not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRow = (id: string, overrides: Partial<SubordinateRow> = {}): SubordinateRow => ({
  id,
  name: '田中太郎',
  strength: '言語化能力',
  achievement: 'チーム底上げ',
  teamRole: 'リーダー気質',
  challenge: '他人の成績に目移りする',
  guidance: '自分の実行を優先するよう伝えた',
  change: '能動的にアドバイスを求めるようになった',
  futureCareer: '研修担当',
  ...overrides,
});

const buildSummary = (
  id: string,
  overrides: Partial<SubordinateSummary> = {},
): SubordinateSummary => ({
  id,
  title: '営業部 5 名',
  subordinates: [buildRow('01ROW0001')],
  memo: '',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
  ...overrides,
});

describe('SubordinateSummaryStoragePort contract', () => {
  let storage: SubordinateSummaryStoragePort;

  beforeEach(() => {
    storage = new InMemorySubordinateSummaryStorage();
  });

  describe('create / get', () => {
    it('create したシートを get で取得できる', async () => {
      const summary = buildSummary('01SUMMARY1');
      await storage.create(summary);
      expect(await storage.get('01SUMMARY1')).toEqual(summary);
    });

    it('subordinates 配列の中身も保持される', async () => {
      const rows = [buildRow('01ROW0001'), buildRow('01ROW0002', { name: '佐藤' })];
      await storage.create(buildSummary('01SUMMARY1', { subordinates: rows }));
      const got = await storage.get('01SUMMARY1');
      expect(got?.subordinates).toEqual(rows);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('list', () => {
    it('作成済みの全件を createdAt 昇順で返す', async () => {
      await storage.create(buildSummary('01SUMMARY2', { createdAt: '2026-05-02T01:00:00Z' }));
      await storage.create(buildSummary('01SUMMARY1', { createdAt: '2026-05-01T00:00:00Z' }));
      const list = await storage.list();
      expect(list.map((s) => s.id)).toEqual(['01SUMMARY1', '01SUMMARY2']);
    });

    it('データがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });
  });

  describe('update', () => {
    it('title を patch で更新できる', async () => {
      await storage.create(buildSummary('01SUMMARY1', { title: '旧' }));
      const updated = await storage.update('01SUMMARY1', { title: '新' });
      expect(updated.title).toBe('新');
    });

    it('subordinates を空配列に更新できる', async () => {
      await storage.create(buildSummary('01SUMMARY1'));
      const updated = await storage.update('01SUMMARY1', { subordinates: [] });
      expect(updated.subordinates).toEqual([]);
    });

    it('subordinates に複数の row を追加できる', async () => {
      await storage.create(buildSummary('01SUMMARY1'));
      const newRows = [
        buildRow('01ROW0001'),
        buildRow('01ROW0002', { name: '佐藤' }),
        buildRow('01ROW0003', { name: '鈴木' }),
      ];
      const updated = await storage.update('01SUMMARY1', { subordinates: newRows });
      expect(updated.subordinates).toHaveLength(3);
    });

    it('memo を更新できる', async () => {
      await storage.create(buildSummary('01SUMMARY1', { memo: '' }));
      const updated = await storage.update('01SUMMARY1', { memo: '面談で補足' });
      expect(updated.memo).toBe('面談で補足');
    });

    it('id / createdAt は不可変', async () => {
      await storage.create(buildSummary('01SUMMARY1', { createdAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01SUMMARY1', { title: '新' });
      expect(updated.id).toBe('01SUMMARY1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildSummary('01SUMMARY1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01SUMMARY1', { title: '新' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { title: '新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildSummary('01SUMMARY1'));
      await storage.delete('01SUMMARY1');
      expect(await storage.get('01SUMMARY1')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.create(buildSummary('01SUMMARY1'));
      await storage.create(buildSummary('01SUMMARY2'));
      await storage.delete('01SUMMARY1');
      const list = await storage.list();
      expect(list.map((s) => s.id)).toEqual(['01SUMMARY2']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
