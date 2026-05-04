import { beforeEach, describe, expect, it } from 'vitest';
import type {
  ApplicationMotive,
  IronApplicationMotive,
  StandardApplicationMotive,
} from '../../src/domain/application-motive.js';
import type { ApplicationMotiveStoragePort } from '../../src/ports/application-motive-storage-port.js';
import type { ApplicationMotiveUpdate } from '../../src/schemas/application-motive.js';

class InMemoryApplicationMotiveStorage implements ApplicationMotiveStoragePort {
  private store = new Map<string, ApplicationMotive>();

  async save(motive: ApplicationMotive): Promise<ApplicationMotive> {
    this.store.set(motive.id, motive);
    return motive;
  }

  async list(): Promise<ApplicationMotive[]> {
    return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listByJobTarget(jobTargetId: string): Promise<ApplicationMotive[]> {
    return (await this.list()).filter((m) => m.jobTargetId === jobTargetId);
  }

  async get(id: string): Promise<ApplicationMotive | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: ApplicationMotiveUpdate): Promise<ApplicationMotive> {
    const current = this.store.get(id);
    if (!current) throw new Error(`ApplicationMotive not found: ${id}`);
    const updated: ApplicationMotive = {
      ...current,
      ...patch,
      id: current.id,
      jobTargetId: current.jobTargetId,
      createdAt: current.createdAt,
      updatedAt: '2026-05-02T12:00:00Z',
    } as ApplicationMotive;
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`ApplicationMotive not found: ${id}`);
    this.store.delete(id);
  }
}

const commonFields = {
  formattedText: '私はDX 推進を達成するために、貴社を志望しています。',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
};

const buildStandard = (
  id: string,
  jobTargetId: string,
  overrides: Partial<StandardApplicationMotive> = {},
): StandardApplicationMotive => ({
  id,
  jobTargetId,
  style: 'standard',
  companyFuture: 'DX 推進',
  contributionAction: 'プロダクト開発の高速化',
  leveragedExperience: 'スタートアップ経験',
  infoSourceType: null,
  infoSourceUrl: '',
  targetDepartment: '',
  departmentChallenge: '',
  ...commonFields,
  ...overrides,
});

const buildIron = (
  id: string,
  jobTargetId: string,
  overrides: Partial<IronApplicationMotive> = {},
): IronApplicationMotive => ({
  id,
  jobTargetId,
  style: 'iron',
  positiveInfluence: '顧客の行動変容',
  beforeAfterFact: 'CSV 手作業 → 自動化',
  selfIdentification: 'provider',
  providerSwitchMoment: '転換点エピソード',
  valueAnalysisType: 'marketIn',
  valueAnalysisDetail: '顧客課題起点',
  postJoinActionPlan: '入社後計画',
  ...commonFields,
  ...overrides,
});

describe('ApplicationMotiveStoragePort contract', () => {
  let storage: ApplicationMotiveStoragePort;

  beforeEach(() => {
    storage = new InMemoryApplicationMotiveStorage();
  });

  describe('save / get（standard）', () => {
    it('save したレコードを get で取得できる', async () => {
      const m = buildStandard('01APPMO01', '01JOBTG1');
      await storage.save(m);
      expect(await storage.get('01APPMO01')).toEqual(m);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('save / get（iron）', () => {
    it('iron レコードを save して get で取得できる', async () => {
      const m = buildIron('01APPMO01', '01JOBTG1');
      await storage.save(m);
      const got = await storage.get('01APPMO01');
      expect(got).toEqual(m);
      expect(got?.style).toBe('iron');
    });
  });

  describe('list', () => {
    it('全件を createdAt 昇順で返す', async () => {
      await storage.save(
        buildStandard('01APPMO02', '01JOBTG1', { createdAt: '2026-05-02T00:00:00Z' }),
      );
      await storage.save(
        buildStandard('01APPMO01', '01JOBTG1', { createdAt: '2026-05-01T00:00:00Z' }),
      );
      const list = await storage.list();
      expect(list.map((m) => m.id)).toEqual(['01APPMO01', '01APPMO02']);
    });

    it('standard と iron が混在しても全件返す', async () => {
      await storage.save(buildStandard('01APPMO01', '01JOBTG1'));
      await storage.save(buildIron('01APPMO02', '01JOBTG1'));
      const list = await storage.list();
      expect(list).toHaveLength(2);
      const styles = list.map((m) => m.style).sort();
      expect(styles).toEqual(['iron', 'standard']);
    });

    it('レコードがない場合は空配列', async () => {
      expect(await storage.list()).toEqual([]);
    });
  });

  describe('listByJobTarget', () => {
    it('指定した jobTargetId のレコードのみ返す', async () => {
      await storage.save(buildStandard('01APPMO01', '01JOBTG1'));
      await storage.save(buildStandard('01APPMO02', '01JOBTG2'));
      await storage.save(buildIron('01APPMO03', '01JOBTG1'));
      const list = await storage.listByJobTarget('01JOBTG1');
      expect(list.map((m) => m.id).sort()).toEqual(['01APPMO01', '01APPMO03']);
    });

    it('該当なしの場合は空配列', async () => {
      await storage.save(buildStandard('01APPMO01', '01JOBTG1'));
      expect(await storage.listByJobTarget('no-such-target')).toEqual([]);
    });
  });

  describe('update（standard）', () => {
    it('companyFuture を patch で更新できる', async () => {
      await storage.save(buildStandard('01APPMO01', '01JOBTG1', { companyFuture: '旧ビジョン' }));
      const updated = await storage.update('01APPMO01', { companyFuture: '新ビジョン' });
      expect(updated.style).toBe('standard');
      if (updated.style === 'standard') {
        expect(updated.companyFuture).toBe('新ビジョン');
      }
    });

    it('formattedText を更新できる', async () => {
      await storage.save(buildStandard('01APPMO01', '01JOBTG1'));
      const updated = await storage.update('01APPMO01', { formattedText: '新しい文章' });
      expect(updated.formattedText).toBe('新しい文章');
    });

    it('jobTargetId は不可変', async () => {
      await storage.save(buildStandard('01APPMO01', '01JOBTG1'));
      const updated = await storage.update('01APPMO01', { companyFuture: '変更' });
      expect(updated.jobTargetId).toBe('01JOBTG1');
    });

    it('id / createdAt は不可変', async () => {
      await storage.save(
        buildStandard('01APPMO01', '01JOBTG1', { createdAt: '2026-01-01T00:00:00Z' }),
      );
      const updated = await storage.update('01APPMO01', { companyFuture: '変更' });
      expect(updated.id).toBe('01APPMO01');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.save(
        buildStandard('01APPMO01', '01JOBTG1', { updatedAt: '2026-01-01T00:00:00Z' }),
      );
      const updated = await storage.update('01APPMO01', { companyFuture: '変更' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { companyFuture: 'x' })).rejects.toThrow();
    });
  });

  describe('update（iron）', () => {
    it('positiveInfluence を patch で更新できる', async () => {
      await storage.save(buildIron('01APPMO01', '01JOBTG1', { positiveInfluence: '旧影響' }));
      const updated = await storage.update('01APPMO01', { positiveInfluence: '新影響' });
      expect(updated.style).toBe('iron');
      if (updated.style === 'iron') {
        expect(updated.positiveInfluence).toBe('新影響');
      }
    });

    it('valueAnalysisType を切り替えられる', async () => {
      await storage.save(buildIron('01APPMO01', '01JOBTG1', { valueAnalysisType: 'productOut' }));
      const updated = await storage.update('01APPMO01', { valueAnalysisType: 'marketIn' });
      if (updated.style === 'iron') {
        expect(updated.valueAnalysisType).toBe('marketIn');
      }
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.save(buildStandard('01APPMO01', '01JOBTG1'));
      await storage.delete('01APPMO01');
      expect(await storage.get('01APPMO01')).toBeNull();
    });

    it('削除後 list から消える', async () => {
      await storage.save(buildStandard('01APPMO01', '01JOBTG1'));
      await storage.save(buildStandard('01APPMO02', '01JOBTG1'));
      await storage.delete('01APPMO01');
      const list = await storage.list();
      expect(list.map((m) => m.id)).toEqual(['01APPMO02']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
