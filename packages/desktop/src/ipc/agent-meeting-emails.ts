import type { AgentMeetingEmail, AgentMeetingEmailUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

export type CreateAgentMeetingEmailArgs = {
  agentTrackRecordId?: string | null;
  subject?: string;
  body?: string;
  sentAt?: string | null;
  memo?: string;
};

export async function createAgentMeetingEmail(
  args: CreateAgentMeetingEmailArgs,
): Promise<AgentMeetingEmail> {
  return invoke<AgentMeetingEmail>('create_agent_meeting_email', { args });
}

export async function listAgentMeetingEmails(): Promise<AgentMeetingEmail[]> {
  return invoke<AgentMeetingEmail[]>('list_agent_meeting_emails');
}

export async function listAgentMeetingEmailsByAgent(
  agentTrackRecordId: string,
): Promise<AgentMeetingEmail[]> {
  return invoke<AgentMeetingEmail[]>('list_agent_meeting_emails_by_agent', {
    agentTrackRecordId,
  });
}

export async function getAgentMeetingEmail(id: string): Promise<AgentMeetingEmail | null> {
  return invoke<AgentMeetingEmail | null>('get_agent_meeting_email', { id });
}

export async function updateAgentMeetingEmail(
  id: string,
  patch: AgentMeetingEmailUpdate,
): Promise<AgentMeetingEmail> {
  return invoke<AgentMeetingEmail>('update_agent_meeting_email', { id, patch });
}

export async function deleteAgentMeetingEmail(id: string): Promise<void> {
  return invoke<void>('delete_agent_meeting_email', { id });
}
