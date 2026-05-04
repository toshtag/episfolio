import type {
  AgentTrackRecord,
  AgentTrackRecordUpdate,
  ConsultantQuality,
} from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

export type CreateAgentTrackRecordArgs = {
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  firstContactDate?: string | null;
  memo?: string;
  status?: AgentTrackRecord['status'];
  specialtyIndustries?: string | null;
  specialtyJobTypes?: string | null;
  consultantQuality?: ConsultantQuality | null;
  hasExclusiveJobs?: boolean | null;
  providesRecommendationLetter?: boolean | null;
  recommendationLetterReceived?: boolean | null;
  numberOfJobsIntroduced?: number | null;
  responseSpeedDays?: number | null;
  overallRating?: number | null;
};

export async function createAgentTrackRecord(
  args: CreateAgentTrackRecordArgs,
): Promise<AgentTrackRecord> {
  return invoke<AgentTrackRecord>('create_agent_track_record', { args });
}

export async function listAgentTrackRecords(): Promise<AgentTrackRecord[]> {
  return invoke<AgentTrackRecord[]>('list_agent_track_records');
}

export async function getAgentTrackRecord(id: string): Promise<AgentTrackRecord | null> {
  return invoke<AgentTrackRecord | null>('get_agent_track_record', { id });
}

export async function updateAgentTrackRecord(
  id: string,
  patch: AgentTrackRecordUpdate,
): Promise<AgentTrackRecord> {
  return invoke<AgentTrackRecord>('update_agent_track_record', { id, patch });
}

export async function deleteAgentTrackRecord(id: string): Promise<void> {
  return invoke<void>('delete_agent_track_record', { id });
}
