import { beforeEach, describe, expect, it } from 'vitest';
import type { JobRequirementMapping } from '../../src/domain/job-requirement-mapping.js';
import type { JobRequirementMappingStoragePort } from '../../src/ports/job-requirement-mapping-storage-port.js';
import type { JobRequirementMappingUpdate } from '../../src/schemas/job-requirement-mapping.js';

class InMemoryJobRequirementMappingStorage implements JobRequirementMappingStoragePort {
  private store = new Map<string, JobRequirementMapping>();

  async save(mapping: JobRequirementMapping): Promise<JobRequirementMapping> {
    this.store.set(mapping.id, mapping);
    return mapping;
  }

  async listByJobTarget(jobTargetId: string): Promise<JobRequirementMapping[]> {
    return Array.from(this.store.values())
      .filter((m) => m.jobTargetId === jobTargetId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<JobRequirementMapping | null> {
    return this.store.get(id) ?? null;
  }

  async update(
    id: string,
    patch: JobRequirementMappingUpdate,
  ): Promise<JobRequirementMapping> {
    const current = this.store.get(id);
    if (!current) throw new Error(`JobRequirementMapping not found: ${id}`);
    const updated: JobRequirementMapping = {
      ...current,
      ...patch,
      id: current.id,
      jobTargetId: current.jobTargetId,
      requirementSkillId: current.requirementSkillId,
      createdAt: current.createdAt,
      updatedAt: '2026-05-01T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`JobRequirementMapping not found: ${id}`);
    this.store.delete(id);
  }
}

const buildMapping = (
  id: string,
  overrides: Partial<JobRequirementMapping> = {},
): JobRequirementMapping => ({
  id,
  jobTargetId: '01HJOB1',
  requirementSkillId: '01HSKL1',
  episodeIds: [],
  userNote: '',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('JobRequirementMappingStoragePort contract', () => {
  let storage: JobRequirementMappingStoragePort;

  beforeEach(() => {
    storage = new InMemoryJobRequirementMappingStorage();
  });

  describe('save / get', () => {
    it('save した mapping を get で取得できる', async () => {
      const m = buildMapping('01HJM1');
      await storage.save(m);
      expect(await storage.get('01HJM1')).toEqual(m);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });

    it('同じ id で save すると上書きされる', async () => {
      await storage.save(buildMapping('01HJM1', { userNote: '初版' }));
      await storage.save(buildMapping('01HJM1', { userNote: '上書き' }));
      const got = await storage.get('01HJM1');
      expect(got?.userNote).toBe('上書き');
    });
  });

  describe('listByJobTarget', () => {
    it('指定した jobTargetId の mapping のみ返す', async () => {
      await storage.save(buildMapping('01HJM1', { jobTargetId: '01HJOB_A' }));
      await storage.save(buildMapping('01HJM2', { jobTargetId: '01HJOB_B' }));
      await storage.save(buildMapping('01HJM3', { jobTargetId: '01HJOB_A' }));
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((m) => m.id).sort()).toEqual(['01HJM1', '01HJM3']);
    });

    it('該当 mapping がない jobTargetId は空配列', async () => {
      await storage.save(buildMapping('01HJM1', { jobTargetId: '01HJOB_A' }));
      expect(await storage.listByJobTarget('01HJOB_X')).toEqual([]);
    });
  });

  describe('update', () => {
    it('episodeIds を patch で更新できる', async () => {
      await storage.save(buildMapping('01HJM1'));
      const updated = await storage.update('01HJM1', { episodeIds: ['01HEP1', '01HEP2'] });
      expect(updated.episodeIds).toEqual(['01HEP1', '01HEP2']);
    });

    it('userNote を patch で更新できる', async () => {
      await storage.save(buildMapping('01HJM1', { userNote: '元メモ' }));
      const updated = await storage.update('01HJM1', { userNote: '新メモ' });
      expect(updated.userNote).toBe('新メモ');
    });

    it('id / jobTargetId / requirementSkillId / createdAt は不可変', async () => {
      await storage.save(
        buildMapping('01HJM1', {
          jobTargetId: '01HJOB1',
          requirementSkillId: '01HSKL1',
          createdAt: '2026-01-01T00:00:00Z',
        }),
      );
      const updated = await storage.update('01HJM1', { userNote: '変更' });
      expect(updated.id).toBe('01HJM1');
      expect(updated.jobTargetId).toBe('01HJOB1');
      expect(updated.requirementSkillId).toBe('01HSKL1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.save(buildMapping('01HJM1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HJM1', { userNote: '変更' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { userNote: 'X' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.save(buildMapping('01HJM1'));
      await storage.delete('01HJM1');
      expect(await storage.get('01HJM1')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.save(buildMapping('01HJM1', { jobTargetId: '01HJOB_A' }));
      await storage.save(buildMapping('01HJM2', { jobTargetId: '01HJOB_A' }));
      await storage.delete('01HJM1');
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((m) => m.id)).toEqual(['01HJM2']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
