import type { Episode } from '../domain/episode.js';
import type { EpisodeUpdate } from '../schemas/episode.js';

export interface EpisodeStoragePort {
  create(episode: Episode): Promise<Episode>;
  list(): Promise<Episode[]>;
  get(id: string): Promise<Episode | null>;
  update(id: string, patch: EpisodeUpdate): Promise<Episode>;
  delete(id: string): Promise<void>;
}
