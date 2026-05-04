import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createResignationPlan,
  deleteResignationPlan,
  getResignationPlan,
  listResignationPlansByJobTarget,
  updateResignationPlan,
} from '../resignation-plans.js';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const invokeMock = vi.mocked(invoke);

describe('resignation-plans ipc', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('createResignationPlan は全フィールドを args として渡す', async () => {
    const result = { id: 'rp1', jobTargetId: 'jt1' };
    invokeMock.mockResolvedValue(result);

    const args = {
      jobTargetId: 'jt1',
      annualSalary: 7_000_000,
      annualHolidays: 125,
      dailyWorkingHours: 7.5,
      commuteMinutes: 35,
      positionNote: 'Tech lead',
      recruitmentBackground: 'expansion' as const,
      riskMemo: 'handover risk',
      finalInterviewAt: '2026-05-10',
      offerNotifiedAt: '2026-05-12',
      offerAcceptedAt: '2026-05-13',
      resignationNotifiedAt: '2026-05-14',
      handoverStartedAt: '2026-05-15',
      lastWorkingDayAt: '2026-06-20',
      paidLeaveStartAt: '2026-06-21',
      joinedAt: '2026-07-01',
      availableDateFrom: '2026-06-24',
      availableDateTo: '2026-06-30',
      negotiationNote: 'start date',
      samuraiLossNote: 'loss',
      samuraiGainNote: 'gain',
      nextExitPlan: 'next',
    };

    await expect(createResignationPlan(args)).resolves.toBe(result);
    expect(invokeMock).toHaveBeenCalledWith('create_resignation_plan', { args });
  });

  it('read/update/delete は command 名と payload を固定する', async () => {
    invokeMock.mockResolvedValue([]);
    await listResignationPlansByJobTarget('jt1');
    expect(invokeMock).toHaveBeenLastCalledWith('list_resignation_plans_by_job_target', {
      jobTargetId: 'jt1',
    });

    invokeMock.mockResolvedValue({ id: 'rp1' });
    await getResignationPlan('rp1');
    expect(invokeMock).toHaveBeenLastCalledWith('get_resignation_plan', { id: 'rp1' });

    const patch = {
      annualSalary: null,
      recruitmentBackground: null,
      nextExitPlan: 'updated',
    };
    await updateResignationPlan('rp1', patch);
    expect(invokeMock).toHaveBeenLastCalledWith('update_resignation_plan', { id: 'rp1', patch });

    invokeMock.mockResolvedValue(undefined);
    await deleteResignationPlan('rp1');
    expect(invokeMock).toHaveBeenLastCalledWith('delete_resignation_plan', { id: 'rp1' });
  });
});
