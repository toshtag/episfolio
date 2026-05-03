import { beforeEach, describe, expect, it } from 'vitest';
import type { RecruitmentImpression } from '../../src/domain/recruitment-impression.js';
import type { RecruitmentImpressionStoragePort } from '../../src/ports/recruitment-impression-storage-port.js';
import type { RecruitmentImpressionUpdate } from '../../src/schemas/recruitment-impression.js';

class InMemoryRecruitmentImpressionStorage implements RecruitmentImpressionStoragePort {
  private store = new Map<string, RecruitmentImpression>();

  async create(record: RecruitmentImpression): Promise<RecruitmentImpression> {
    this.store.set(record.id, record);
    return record;
  }

  async listByJobTarget(jobTargetId: string): Promise<RecruitmentImpression[]> {
    return Array.from(this.store.values())
      .filter((r) => r.jobTargetId === jobTargetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<RecruitmentImpression | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: RecruitmentImpressionUpdate): Promise<RecruitmentImpression> {
    const current = this.store.get(id);
    if (!current) throw new Error(`RecruitmentImpression not found: ${id}`);
    const updated: RecruitmentImpression = {
      ...current,
      ...patch,
      id: current.id,
      jobTargetId: current.jobTargetId,
      createdAt: current.createdAt,
      updatedAt: '2026-05-03T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`RecruitmentImpression not found: ${id}`);
    this.store.delete(id);
  }
}

const buildRecord = (
  id: string,
  overrides: Partial<RecruitmentImpression> = {},
): RecruitmentImpression => ({
  id,
  jobTargetId: '01JT00001',
  selectionProcessNote: '書類→一次→最終の3段階',
  officeAtmosphere: '受付対応が丁寧',
  sensoryObservations: [{ category: '視覚', note: 'オープンフロア' }],
  lifestyleCompatibilityNote: '残業少なめ、在宅可',
  redFlagsNote: null,
  overallImpression: '良好な印象',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('RecruitmentImpressionStoragePort contract', () => {
  let storage: RecruitmentImpressionStoragePort;

  beforeEach(() => {
    storage = new InMemoryRecruitmentImpressionStorage();
  });

  describe('create / get', () => {
    it('create したレコードを get で取得できる', async () => {
      const record = buildRecord('01RI00001');
      await storage.create(record);
      expect(await storage.get('01RI00001')).toEqual(record);
    });

    it('nullable フィールドが null でも保存できる', async () => {
      const record = buildRecord('01RI00001', {
        selectionProcessNote: null,
        officeAtmosphere: null,
        lifestyleCompatibilityNote: null,
        redFlagsNote: null,
        overallImpression: null,
      });
      await storage.create(record);
      const got = await storage.get('01RI00001');
      expect(got?.selectionProcessNote).toBeNull();
      expect(got?.overallImpression).toBeNull();
    });

    it('sensoryObservations が空配列でも保存できる', async () => {
      const record = buildRecord('01RI00001', { sensoryObservations: [] });
      await storage.create(record);
      expect((await storage.get('01RI00001'))?.sensoryObservations).toEqual([]);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('listByJobTarget', () => {
    it('同一 jobTargetId のレコードのみ返す', async () => {
      await storage.create(buildRecord('01RI00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01RI00002', { jobTargetId: '01JT00002' }));
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01RI00001']);
    });

    it('同一 jobTargetId の複数レコードを createdAt 降順で返す', async () => {
      await storage.create(
        buildRecord('01RI00001', {
          jobTargetId: '01JT00001',
          createdAt: '2026-05-01T00:00:00Z',
        }),
      );
      await storage.create(
        buildRecord('01RI00002', {
          jobTargetId: '01JT00001',
          createdAt: '2026-05-03T00:00:00Z',
        }),
      );
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01RI00002', '01RI00001']);
    });

    it('該当レコードがない場合は空配列', async () => {
      expect(await storage.listByJobTarget('non-existent')).toEqual([]);
    });
  });

  describe('update', () => {
    it('selectionProcessNote を更新できる', async () => {
      await storage.create(buildRecord('01RI00001', { selectionProcessNote: '旧情報' }));
      const updated = await storage.update('01RI00001', { selectionProcessNote: '新情報（5段階）' });
      expect(updated.selectionProcessNote).toBe('新情報（5段階）');
    });

    it('redFlagsNote を null に更新できる', async () => {
      await storage.create(buildRecord('01RI00001', { redFlagsNote: '危険信号あり' }));
      const updated = await storage.update('01RI00001', { redFlagsNote: null });
      expect(updated.redFlagsNote).toBeNull();
    });

    it('sensoryObservations を更新できる', async () => {
      await storage.create(buildRecord('01RI00001'));
      const newObs = [
        { category: '視覚', note: '新しい観察' },
        { category: '聴覚', note: '静かな環境' },
      ];
      const updated = await storage.update('01RI00001', { sensoryObservations: newObs });
      expect(updated.sensoryObservations).toEqual(newObs);
    });

    it('id / jobTargetId / createdAt は不可変', async () => {
      await storage.create(
        buildRecord('01RI00001', {
          jobTargetId: '01JT00001',
          createdAt: '2026-01-01T00:00:00Z',
        }),
      );
      const updated = await storage.update('01RI00001', { overallImpression: '更新後印象' });
      expect(updated.id).toBe('01RI00001');
      expect(updated.jobTargetId).toBe('01JT00001');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildRecord('01RI00001', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01RI00001', { overallImpression: '更新後印象' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { overallImpression: '更新' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildRecord('01RI00001'));
      await storage.delete('01RI00001');
      expect(await storage.get('01RI00001')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.create(buildRecord('01RI00001', { jobTargetId: '01JT00001' }));
      await storage.create(buildRecord('01RI00002', { jobTargetId: '01JT00001' }));
      await storage.delete('01RI00001');
      const list = await storage.listByJobTarget('01JT00001');
      expect(list.map((r) => r.id)).toEqual(['01RI00002']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
