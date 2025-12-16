/**
 * FirebaseSyncManager
 * Handles Firebase anonymous authentication and Firestore sync
 */

import { playerDataManager } from './PlayerDataManager';

// FirebaseAuth plugin (exposed via Capacitor)
import { registerPlugin } from '@capacitor/core';

export interface FirebaseAuthPlugin {
  signInAnonymously(): Promise<{ userId: string }>;
  getCurrentUserId(): Promise<{ userId: string | null }>;
  savePlayerData(options: { userId: string; data: any }): Promise<{ success: boolean }>;
  loadPlayerData(options: { userId: string }): Promise<{ data: any | null }>;
  syncPlayerData(options: { userId: string; localData: any }): Promise<{ data: any | null }>;
}

const FirebaseAuth = registerPlugin<FirebaseAuthPlugin>('FirebaseAuth', {
  web: () => import('./FirebaseAuthPlugin.web').then(m => new m.FirebaseAuthPluginWeb()),
});

class FirebaseSyncManager {
  private userId: string | null = null;
  private isAuthenticated: boolean = false;
  private syncInProgress: boolean = false;
  private syncQueue: Array<() => Promise<void>> = [];
  private syncInterval: number | null = null;

  /**
   * Initialize anonymous authentication
   */
  async initialize(): Promise<string | null> {
    if (this.isAuthenticated && this.userId) {
      return this.userId;
    }

    try {
      // Check if already authenticated
      const result = await FirebaseAuth.getCurrentUserId();
      if (result.userId) {
        this.userId = result.userId;
        this.isAuthenticated = true;
        return result.userId;
      }

      // Sign in anonymously
      const authResult = await FirebaseAuth.signInAnonymously();
      this.userId = authResult.userId;
      this.isAuthenticated = true;
      console.log('Signed in anonymously with UID:', authResult.userId);
      return authResult.userId;
    } catch (error) {
      console.error('Failed to initialize Firebase auth:', error);
      return null;
    }
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Refresh user ID from plugin
   */
  async refreshUserId(): Promise<string | null> {
    try {
      const result = await FirebaseAuth.getCurrentUserId();
      if (result.userId) {
        this.userId = result.userId;
        this.isAuthenticated = true;
      }
      return result.userId;
    } catch (error) {
      console.error('Failed to refresh user ID:', error);
      return null;
    }
  }

  /**
   * Check if authenticated
   */
  isReady(): boolean {
    return this.isAuthenticated && this.userId !== null;
  }

  /**
   * Perform initial sync on app launch
   */
  async performInitialSync(): Promise<void> {
    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) {
        return;
      }
    }

    const localData = playerDataManager.getFirebaseData();
    if (!localData) {
      return;
    }

    if (!this.userId) {
      return;
    }

    try {
      const result = await FirebaseAuth.syncPlayerData({
        userId: this.userId,
        localData: localData,
      });

      if (result.data) {
        playerDataManager.mergeFirebaseData(result.data);
        playerDataManager.setLastSyncedAt(new Date().toISOString());
        playerDataManager.save();
      }
    } catch (error) {
      console.error('Initial sync failed:', error);
    }
  }

  /**
   * Sync player data to Firebase
   */
  async sync(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) {
        return;
      }
    }

    this.syncInProgress = true;

    const localData = playerDataManager.getFirebaseData();
    if (!localData) {
      this.syncInProgress = false;
      return;
    }

    if (!this.userId) {
      this.syncInProgress = false;
      return;
    }

    try {
      await FirebaseAuth.savePlayerData({
        userId: this.userId,
        data: localData,
      });

      playerDataManager.setLastSyncedAt(new Date().toISOString());
      playerDataManager.save();
    } catch (error) {
      console.warn('Sync failed:', error);
      // Queue for retry
      this.queueSync();
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Queue a sync operation (for offline scenarios)
   */
  queueSync(): void {
    if (this.syncQueue.length === 0) {
      this.syncQueue.push(() => this.sync());
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue(): Promise<void> {
    while (this.syncQueue.length > 0) {
      const syncOp = this.syncQueue.shift();
      if (syncOp) {
        try {
          await syncOp();
        } catch (error) {
          console.error('Sync queue operation failed:', error);
        }
      }
    }
  }

  /**
   * Start periodic sync (every 30 seconds)
   */
  startPeriodicSync(): void {
    if (this.syncInterval !== null) {
      return; // Already started
    }

    this.syncInterval = window.setInterval(() => {
      if (this.isReady() && !this.syncInProgress) {
        this.sync().catch((error) => {
          console.error('Periodic sync failed:', error);
        });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Force immediate sync
   */
  async forceSync(): Promise<void> {
    await this.sync();
    await this.processSyncQueue();
  }
}

// Export singleton instance
export const firebaseSyncManager = new FirebaseSyncManager();
