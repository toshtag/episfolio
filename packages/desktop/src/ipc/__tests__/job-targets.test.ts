import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createJobTarget,
  deleteJobTarget,
  getJobTarget,
  listJobTargets,
  updateJobTarget,
} from '../job-targets.js';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const invokeMock = vi.mocked(invoke);

describe('job-targets ipc', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('createJobTarget は v0.11 拡張フィールドを args として渡す', async () => {
    const result = { id: 'jt1', companyName: 'Acme', jobTitle: 'Engineer' };
    invokeMock.mockResolvedValue(result);

    const args = {
      companyName: 'Acme',
      jobTitle: 'Engineer',
      annualHolidays: 125,
      workingHoursPerDay: 7.5,
      commuteTimeMinutes: 35,
      employmentType: 'regular' as const,
      flexTimeAvailable: true,
      remoteWorkAvailable: false,
      averagePaidLeaveTaken: 12.5,
      vacancyReason: 'expansion',
      currentTeamSize: 8,
      applicationRoute: 'agent' as const,
      wageType: 'annual' as const,
      basicSalary: 6_000_000,
      fixedOvertimeHours: 20,
      bonusBaseMonths: 4,
      hasFutureRaisePromise: true,
      futureRaisePromiseInContract: false,
    };

    await expect(createJobTarget(args)).resolves.toBe(result);
    expect(invokeMock).toHaveBeenCalledWith('create_job_target', { args });
  });

  it('read/update/delete は command 名と payload を固定する', async () => {
    invokeMock.mockResolvedValue([]);
    await listJobTargets();
    expect(invokeMock).toHaveBeenLastCalledWith('list_job_targets');

    invokeMock.mockResolvedValue({ id: 'jt1' });
    await getJobTarget('jt1');
    expect(invokeMock).toHaveBeenLastCalledWith('get_job_target', { id: 'jt1' });

    const patch = {
      annualHolidays: null,
      remoteWorkAvailable: true,
      applicationRoute: 'direct' as const,
    };
    await updateJobTarget('jt1', patch);
    expect(invokeMock).toHaveBeenLastCalledWith('update_job_target', { id: 'jt1', patch });

    invokeMock.mockResolvedValue(undefined);
    await deleteJobTarget('jt1');
    expect(invokeMock).toHaveBeenLastCalledWith('delete_job_target', { id: 'jt1' });
  });
});
