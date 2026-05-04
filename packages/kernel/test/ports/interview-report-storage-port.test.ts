import { beforeEach, describe, expect, it } from 'vitest';
import type { InterviewReport } from '../../src/domain/interview-report.js';
import type { InterviewReportStoragePort } from '../../src/ports/interview-report-storage-port.js';
import type { InterviewReportUpdate } from '../../src/schemas/interview-report.js';

class InMemoryInterviewReportStorage implements InterviewReportStoragePort {
  private store = new Map<string, InterviewReport>();

  async create(report: InterviewReport): Promise<InterviewReport> {
    this.store.set(report.id, report);
    return report;
  }

  async listByJobTarget(jobTargetId: string): Promise<InterviewReport[]> {
    return Array.from(this.store.values())
      .filter((r) => r.jobTargetId === jobTargetId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<InterviewReport | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, patch: InterviewReportUpdate): Promise<InterviewReport> {
    const current = this.store.get(id);
    if (!current) throw new Error(`InterviewReport not found: ${id}`);
    const updated: InterviewReport = {
      ...current,
      ...patch,
      id: current.id,
      jobTargetId: current.jobTargetId,
      createdAt: current.createdAt,
      updatedAt: '2026-05-02T12:00:00Z',
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new Error(`InterviewReport not found: ${id}`);
    this.store.delete(id);
  }
}

const buildReport = (id: string, overrides: Partial<InterviewReport> = {}): InterviewReport => ({
  id,
  jobTargetId: '01HJOB1',
  stage: 'first',
  interviewerNote: '',
  qaNote: '',
  motivationChangeNote: '',
  questionsToBringNote: '',
  conductedAt: null,
  interviewerRole: null,
  interviewerStyle: null,
  talkRatioSelf: null,
  questionsAskedNote: null,
  responseImpression: null,
  blankAreasNote: null,
  improvementNote: null,
  passed: null,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
  ...overrides,
});

describe('InterviewReportStoragePort contract', () => {
  let storage: InterviewReportStoragePort;

  beforeEach(() => {
    storage = new InMemoryInterviewReportStorage();
  });

  describe('create / get', () => {
    it('create した report を get で取得できる', async () => {
      const r = buildReport('01HIRPT1');
      await storage.create(r);
      expect(await storage.get('01HIRPT1')).toEqual(r);
    });

    it('存在しない id で get すると null', async () => {
      expect(await storage.get('not-found')).toBeNull();
    });
  });

  describe('listByJobTarget', () => {
    it('指定した jobTargetId の report のみ返す', async () => {
      await storage.create(buildReport('01HIRPT1', { jobTargetId: '01HJOB_A' }));
      await storage.create(buildReport('01HIRPT2', { jobTargetId: '01HJOB_B' }));
      await storage.create(buildReport('01HIRPT3', { jobTargetId: '01HJOB_A' }));
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((r) => r.id).sort()).toEqual(['01HIRPT1', '01HIRPT3']);
    });

    it('createdAt 昇順で返す', async () => {
      await storage.create(
        buildReport('01HIRPT1', {
          jobTargetId: '01HJOB_A',
          createdAt: '2026-05-02T00:00:00Z',
        }),
      );
      await storage.create(
        buildReport('01HIRPT2', {
          jobTargetId: '01HJOB_A',
          createdAt: '2026-05-01T00:00:00Z',
        }),
      );
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((r) => r.id)).toEqual(['01HIRPT2', '01HIRPT1']);
    });

    it('該当 report がない jobTargetId は空配列', async () => {
      await storage.create(buildReport('01HIRPT1', { jobTargetId: '01HJOB_A' }));
      expect(await storage.listByJobTarget('01HJOB_X')).toEqual([]);
    });
  });

  describe('update', () => {
    it('qaNote を patch で更新できる', async () => {
      await storage.create(buildReport('01HIRPT1', { qaNote: '旧メモ' }));
      const updated = await storage.update('01HIRPT1', { qaNote: '新メモ' });
      expect(updated.qaNote).toBe('新メモ');
    });

    it('conductedAt を null から文字列に更新できる', async () => {
      await storage.create(buildReport('01HIRPT1', { conductedAt: null }));
      const updated = await storage.update('01HIRPT1', { conductedAt: '2026-05-10T10:00:00Z' });
      expect(updated.conductedAt).toBe('2026-05-10T10:00:00Z');
    });

    it('conductedAt を文字列から null に更新できる', async () => {
      await storage.create(buildReport('01HIRPT1', { conductedAt: '2026-05-10T10:00:00Z' }));
      const updated = await storage.update('01HIRPT1', { conductedAt: null });
      expect(updated.conductedAt).toBeNull();
    });

    it('id / jobTargetId / createdAt は不可変', async () => {
      await storage.create(
        buildReport('01HIRPT1', { jobTargetId: '01HJOB1', createdAt: '2026-01-01T00:00:00Z' }),
      );
      const updated = await storage.update('01HIRPT1', { qaNote: '変更' });
      expect(updated.id).toBe('01HIRPT1');
      expect(updated.jobTargetId).toBe('01HJOB1');
      expect(updated.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('updatedAt が更新される', async () => {
      await storage.create(buildReport('01HIRPT1', { updatedAt: '2026-01-01T00:00:00Z' }));
      const updated = await storage.update('01HIRPT1', { qaNote: '変更' });
      expect(updated.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('存在しない id の update はエラー', async () => {
      await expect(storage.update('not-found', { qaNote: 'x' })).rejects.toThrow();
    });

    it('interviewerStyle を patch で更新できる', async () => {
      await storage.create(buildReport('01HIRPT1'));
      const updated = await storage.update('01HIRPT1', { interviewerStyle: 'numeric' });
      expect(updated.interviewerStyle).toBe('numeric');
    });

    it('passed を true から null に更新できる', async () => {
      await storage.create(buildReport('01HIRPT1', { passed: true }));
      const updated = await storage.update('01HIRPT1', { passed: null });
      expect(updated.passed).toBeNull();
    });

    it('talkRatioSelf を数値で更新できる', async () => {
      await storage.create(buildReport('01HIRPT1'));
      const updated = await storage.update('01HIRPT1', { talkRatioSelf: 60 });
      expect(updated.talkRatioSelf).toBe(60);
    });
  });

  describe('delete', () => {
    it('削除後に get で null になる', async () => {
      await storage.create(buildReport('01HIRPT1'));
      await storage.delete('01HIRPT1');
      expect(await storage.get('01HIRPT1')).toBeNull();
    });

    it('削除後 listByJobTarget から消える', async () => {
      await storage.create(buildReport('01HIRPT1', { jobTargetId: '01HJOB_A' }));
      await storage.create(buildReport('01HIRPT2', { jobTargetId: '01HJOB_A' }));
      await storage.delete('01HIRPT1');
      const list = await storage.listByJobTarget('01HJOB_A');
      expect(list.map((r) => r.id)).toEqual(['01HIRPT2']);
    });

    it('存在しない id の delete はエラー', async () => {
      await expect(storage.delete('not-found')).rejects.toThrow();
    });
  });
});
