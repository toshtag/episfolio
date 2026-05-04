import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAgentTrackRecord,
  deleteAgentTrackRecord,
  getAgentTrackRecord,
  listAgentTrackRecords,
  updateAgentTrackRecord,
} from '../agent-track-records.js';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const invokeMock = vi.mocked(invoke);

describe('agent-track-records ipc', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('createAgentTrackRecord は v0.11 拡張フィールドを args として渡す', async () => {
    const result = { id: 'atr1', companyName: 'Agent Inc.' };
    invokeMock.mockResolvedValue(result);

    const args = {
      companyName: 'Agent Inc.',
      contactName: 'Arai',
      contactEmail: 'agent@example.com',
      contactPhone: '03-0000-0000',
      firstContactDate: '2026-05-04',
      memo: 'strong on SaaS',
      status: 'active' as const,
      specialtyIndustries: 'SaaS, Fintech',
      specialtyJobTypes: 'Engineering manager',
      consultantQuality: 'excellent' as const,
      hasExclusiveJobs: true,
      providesRecommendationLetter: true,
      recommendationLetterReceived: false,
      numberOfJobsIntroduced: 12,
      responseSpeedDays: 1.5,
      overallRating: 5,
    };

    await expect(createAgentTrackRecord(args)).resolves.toBe(result);
    expect(invokeMock).toHaveBeenCalledWith('create_agent_track_record', { args });
  });

  it('read/update/delete は command 名と payload を固定する', async () => {
    invokeMock.mockResolvedValue([]);
    await listAgentTrackRecords();
    expect(invokeMock).toHaveBeenLastCalledWith('list_agent_track_records');

    invokeMock.mockResolvedValue({ id: 'atr1' });
    await getAgentTrackRecord('atr1');
    expect(invokeMock).toHaveBeenLastCalledWith('get_agent_track_record', { id: 'atr1' });

    const patch = {
      consultantQuality: null,
      hasExclusiveJobs: false,
      overallRating: 4,
    };
    await updateAgentTrackRecord('atr1', patch);
    expect(invokeMock).toHaveBeenLastCalledWith('update_agent_track_record', {
      id: 'atr1',
      patch,
    });

    invokeMock.mockResolvedValue(undefined);
    await deleteAgentTrackRecord('atr1');
    expect(invokeMock).toHaveBeenLastCalledWith('delete_agent_track_record', { id: 'atr1' });
  });
});
