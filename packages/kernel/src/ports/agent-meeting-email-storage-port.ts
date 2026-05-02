import type { AgentMeetingEmail } from '../domain/agent-meeting-email.js';
import type { AgentMeetingEmailUpdate } from '../schemas/agent-meeting-email.js';

export interface AgentMeetingEmailStoragePort {
  save(email: AgentMeetingEmail): Promise<AgentMeetingEmail>;
  listByAgent(agentTrackRecordId: string): Promise<AgentMeetingEmail[]>;
  list(): Promise<AgentMeetingEmail[]>;
  get(id: string): Promise<AgentMeetingEmail | null>;
  update(id: string, patch: AgentMeetingEmailUpdate): Promise<AgentMeetingEmail>;
  delete(id: string): Promise<void>;
}
