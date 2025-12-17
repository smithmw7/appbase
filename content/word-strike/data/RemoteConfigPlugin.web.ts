/**
 * Web stub for RemoteConfigPlugin
 */
export class RemoteConfigPluginWeb {
  async fetchRemoteConfig(): Promise<void> {
    console.warn('[RemoteConfig] Web stub - no remote config available');
  }

  async getPuzzleDataUrl(): Promise<{ url: string | null }> {
    return { url: null };
  }

  async getRemoteConfigValue(): Promise<{ value: string | null }> {
    return { value: null };
  }
}
