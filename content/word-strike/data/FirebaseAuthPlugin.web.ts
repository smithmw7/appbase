/**
 * Web implementation of FirebaseAuthPlugin (stub for web development)
 */
export class FirebaseAuthPluginWeb {
  async signInAnonymously(): Promise<{ userId: string }> {
    // Web stub - returns mock ID
    return { userId: 'web-mock-user-id' };
  }

  async getCurrentUserId(): Promise<{ userId: string | null }> {
    return { userId: null };
  }

  async savePlayerData(): Promise<{ success: boolean }> {
    return { success: false };
  }

  async loadPlayerData(): Promise<{ data: any | null }> {
    return { data: null };
  }

  async syncPlayerData(): Promise<{ data: any | null }> {
    return { data: null };
  }
}
