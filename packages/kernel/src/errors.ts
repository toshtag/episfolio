export class RemoteLLMBlockedError extends Error {
  readonly blockedEpisodeIds: string[];

  constructor(blockedEpisodeIds: string[]) {
    super(
      `${blockedEpisodeIds.length} episode(s) have remoteLLMAllowed=false but the provider is remote. ` +
        `Blocked IDs: ${blockedEpisodeIds.join(', ')}`,
    );
    this.name = 'RemoteLLMBlockedError';
    this.blockedEpisodeIds = blockedEpisodeIds;
  }
}
