import type { HiddenGemNote } from '../domain/hidden-gem-note.js';
import type { HiddenGemNoteUpdate } from '../schemas/hidden-gem-note.js';

export interface HiddenGemNoteStoragePort {
  create(record: HiddenGemNote): Promise<HiddenGemNote>;
  listByJobTarget(jobTargetId: string): Promise<HiddenGemNote[]>;
  get(id: string): Promise<HiddenGemNote | null>;
  update(id: string, patch: HiddenGemNoteUpdate): Promise<HiddenGemNote>;
  delete(id: string): Promise<void>;
}
