import type { Episode } from '../domain/episode.js';

export interface EpisodeStoragePort {
  create(episode: Episode): Promise<Episode>;
  list(): Promise<Episode[]>;
}
