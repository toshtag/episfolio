import type { AgentTrackRecord } from '../domain/agent-track-record.js';
import type { AgentTrackRecordUpdate } from '../schemas/agent-track-record.js';

export interface AgentTrackRecordStoragePort {
  create(record: AgentTrackRecord): Promise<AgentTrackRecord>;
  list(): Promise<AgentTrackRecord[]>;
  get(id: string): Promise<AgentTrackRecord | null>;
  update(id: string, patch: AgentTrackRecordUpdate): Promise<AgentTrackRecord>;
  delete(id: string): Promise<void>;
}
