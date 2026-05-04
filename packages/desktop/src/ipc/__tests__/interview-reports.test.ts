import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createInterviewReport,
  deleteInterviewReport,
  getInterviewReport,
  listInterviewReportsByJobTarget,
  updateInterviewReport,
} from '../interview-reports.js';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const invokeMock = vi.mocked(invoke);

describe('interview-reports ipc', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('createInterviewReport は v0.11 拡張フィールドを args として渡す', async () => {
    const result = { id: 'ir1', jobTargetId: 'jt1' };
    invokeMock.mockResolvedValue(result);

    const args = {
      jobTargetId: 'jt1',
      stage: 'final' as const,
      interviewerNote: 'VP interview',
      qaNote: 'architecture discussion',
      motivationChangeNote: 'more interested',
      questionsToBringNote: 'team structure',
      conductedAt: '2026-05-04T10:00:00.000Z',
      interviewerRole: 'VP Engineering',
      interviewerStyle: 'process' as const,
      talkRatioSelf: 45,
      questionsAskedNote: 'delivery ownership',
      responseImpression: 'good' as const,
      blankAreasNote: 'ask about hiring plan',
      improvementNote: 'shorten STAR answer',
      passed: true,
    };

    await expect(createInterviewReport(args)).resolves.toBe(result);
    expect(invokeMock).toHaveBeenCalledWith('create_interview_report', { args });
  });

  it('read/update/delete は command 名と payload を固定する', async () => {
    invokeMock.mockResolvedValue([]);
    await listInterviewReportsByJobTarget('jt1');
    expect(invokeMock).toHaveBeenLastCalledWith('list_interview_reports_by_job_target', {
      jobTargetId: 'jt1',
    });

    invokeMock.mockResolvedValue({ id: 'ir1' });
    await getInterviewReport('ir1');
    expect(invokeMock).toHaveBeenLastCalledWith('get_interview_report', { id: 'ir1' });

    const patch = {
      interviewerStyle: null,
      responseImpression: 'neutral' as const,
      passed: null,
    };
    await updateInterviewReport('ir1', patch);
    expect(invokeMock).toHaveBeenLastCalledWith('update_interview_report', {
      id: 'ir1',
      patch,
    });

    invokeMock.mockResolvedValue(undefined);
    await deleteInterviewReport('ir1');
    expect(invokeMock).toHaveBeenLastCalledWith('delete_interview_report', { id: 'ir1' });
  });
});
