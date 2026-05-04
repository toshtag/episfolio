import { beforeEach, describe, expect, it } from 'vitest';
import type { ResignationPlan } from '../../src/domain/resignation-plan.js';
import type { ResignationPlanStoragePort } from '../../src/ports/resignation-plan-storage-port.js';
import type { ResignationPlanUpdate } from '../../src/schemas/resignation-plan.js';

class InMemoryResignationPlanStorage implements ResignationPlanStoragePort {
  private store = new Map<string, ResignationPlan>();

  async create(plan: ResignationPlan): Promise<ResignationPlan> {
    this.store.set(plan.id, plan);
    return plan;
  }

  async listByJobTarget(jobTargetId: string): Promise<ResignationPlan[]> {
    return Array.from(this.store.values())
      .filter((p) => p.jobTargetId === jobTargetId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<ResignationPlan | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: ResignationPlanUpdate): Promise<ResignationPlan> {
    const current = this.store.get(id);
    if (!current) throw new Error(`ResignationPlan not found: ${id}`);
    const updated: ResignationPlan = {
      ...current,
      ...patch,
      id: current.id,
      jobTargetId: current.jobTargetId,
      createdAt: current.createdAt,
      updatedAt: '2026-05-04T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`ResignationPlan not found: ${id}`);
    this.store.delete(id);
  }
}

const buildPlan = (id: string, overrides: Partial<ResignationPlan> = {}): ResignationPlan => ({
  id,
  jobTargetId: '01HJOB1',
  annualSalary: null,
  annualHolidays: null,
  dailyWorkingHours: null,
  commuteMinutes: null,
  positionNote: '',
  recruitmentBackground: null,
  riskMemo: '',
  finalInterviewAt: null,
  offerNotifiedAt: null,
  offerAcceptedAt: null,
  resignationNotifiedAt: null,
  handoverStartedAt: null,
  lastWorkingDayAt: null,
  paidLeaveStartAt: null,
  joinedAt: null,
  availableDateFrom: null,
  availableDateTo: null,
  negotiationNote: '',
  samuraiLossNote: '',
  samuraiGainNote: '',
  nextExitPlan: '',
  createdAt: '2026-05-04T00:00:00Z',
  updatedAt: '2026-05-04T00:00:00Z',
  ...overrides,
});

describe('ResignationPlanStoragePort contract', () => {
  let storage: ResignationPlanStoragePort;

  beforeEach(() => {
    storage = new InMemoryResignationPlanStorage();
  });

  describe('create / get', () => {
    it('create した plan を get で取得できる', async () => {
      const p = buildPlan('01RSGPLN1');
      await storage.create(p);
      expect(await storage.get('01RSGPLN1')).toEqual(p);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('listByJobTarget', () => {
    it('指定した jobTargetId の plan のみ返す', async () => {
      await storage.create(buildPlan('01RSGPLN1', { jobTargetId: '01HJOB_A' }));
      await storage.create(buildPlan('01RSGPLN2', { jobTargetId: '01HJOB_B' }));
      await storage.create(buildPlan('01RSGPLN3', { jobTargetId: '01HJOB_A' }));
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((p) => p.id).sort()).toEqual(['01RSGPLN1', '01RSGPLN3']);
    });

    it('createdAt 昇順で返す', async () => {
      await storage.create(
        buildPlan('01RSGPLN1', { jobTargetId: '01HJOB_A', createdAt: '2026-05-04T00:00:00Z' }),
      );
      await storage.create(
        buildPlan('01RSGPLN2', { jobTargetId: '01HJOB_A', createdAt: '2026-05-03T00:00:00Z' }),
      );
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((p) => p.id)).toEqual(['01RSGPLN2', '01RSGPLN1']);
    });

    it('該当 plan がない jobTargetId は空配列', async () => {
      await storage.create(buildPlan('01RSGPLN1', { jobTargetId: '01HJOB_A' }));
      expect(await storage.listByJobTarget('01HJOB_X')).toEqual([]);
    });
  });

  describe('update', () => {
    it('negotiationNote を patch で更新できる', async () => {
      await storage.create(buildPlan('01RSGPLN1', { negotiationNote: '旧メモ' }));
      const updated = await storage.update('01RSGPLN1', { negotiationNote: '新メモ' });
      expect(updated.negotiationNote).toBe('新メモ');
    });

    it('offerNotifiedAt を null から文字列に更新できる', async () => {
      await storage.create(buildPlan('01RSGPLN1', { offerNotifiedAt: null }));
      const updated = await storage.update('01RSGPLN1', {
        offerNotifiedAt: '2026-05-10T10:00:00Z',
      });
      expect(updated.offerNotifiedAt).toBe('2026-05-10T10:00:00Z');
    });

    it('offerNotifiedAt を文字列から null に更新できる', async () => {
      await storage.create(buildPlan('01RSGPLN1', { offerNotifiedAt: '2026-05-10T10:00:00Z' }));
      const updated = await storage.update('01RSGPLN1', { offerNotifiedAt: null });
      expect(updated.offerNotifiedAt).toBeNull();
    });

    it('annualSalary を数値で更新できる', async () => {
      await storage.create(buildPlan('01RSGPLN1'));
      const updated = await storage.update('01RSGPLN1', { annualSalary: 7500000 });
      expect(updated.annualSalary).toBe(7500000);
    });

    it('recruitmentBackground を更新できる', async () => {
      await storage.create(buildPlan('01RSGPLN1'));
      const updated = await storage.update('01RSGPLN1', { recruitmentBackground: 'vacancy' });
      expect(updated.recruitmentBackground).toBe('vacancy');
    });

    it('id / jobTargetId / createdAt は不可変', async () => {
      await storage.create(
        buildPlan('01RSGPLN1', { jobTargetId: '01HJOB1', createdAt: '2026-01-01T00:00:00Z' }),
      );
      const updated = await storage.update('01RSGPLN1', { negotiationNote: '変更' });
      expect(updated.id).toBe('01RSGPLN1');
      expect(updated.jobTargetId).toBe('01HJOB1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildPlan('01RSGPLN1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01RSGPLN1', { negotiationNote: '変更' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { negotiationNote: 'x' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildPlan('01RSGPLN1'));
      await storage.delete('01RSGPLN1');
      expect(await storage.get('01RSGPLN1')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.create(buildPlan('01RSGPLN1', { jobTargetId: '01HJOB_A' }));
      await storage.create(buildPlan('01RSGPLN2', { jobTargetId: '01HJOB_A' }));
      await storage.delete('01RSGPLN1');
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((p) => p.id)).toEqual(['01RSGPLN2']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
