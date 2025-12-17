/**
 * RemotePuzzleLoader
 * Handles background Remote Config checks and puzzle data downloads
 */

import { puzzleDataManager } from './PuzzleDataManager';
import { registerPlugin } from '@capacitor/core';
import type { PuzzleDataFile } from '../types/PuzzleData';

// RemoteConfig plugin interface
export interface RemoteConfigPlugin {
  fetchRemoteConfig(): Promise<void>;
  getPuzzleDataUrl(): Promise<{ url: string | null }>;
  getRemoteConfigValue(options: { key: string }): Promise<{ value: string | null }>;
}

const RemoteConfig = registerPlugin<RemoteConfigPlugin>('RemoteConfig', {
  web: () => import('./RemoteConfigPlugin.web').then(m => new m.RemoteConfigPluginWeb()),
});

class RemotePuzzleLoader {
  private updateInProgress: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelays: number[] = [1000, 2000, 4000]; // Exponential backoff in ms

  /**
   * Check for remote puzzle updates
   * Non-blocking, runs in background
   */
  async checkForUpdates(isGameInProgress: boolean = false): Promise<void> {
    if (this.updateInProgress) {
      console.log('[RemotePuzzleLoader] Update already in progress');
      return;
    }

    this.updateInProgress = true;
    this.retryCount = 0;

    try {
      await this.attemptUpdate(isGameInProgress);
    } catch (error) {
      console.error('[RemotePuzzleLoader] Failed to check for updates:', error);
    } finally {
      this.updateInProgress = false;
    }
  }

  /**
   * Attempt to fetch and apply update with retry logic
   */
  private async attemptUpdate(isGameInProgress: boolean): Promise<void> {
    try {
      // 1. Fetch Remote Config
      console.log('[RemotePuzzleLoader] Fetching Remote Config...');
      await this.fetchRemoteConfigWithTimeout();

      // 2. Get puzzle data URL
      const urlResult = await RemoteConfig.getPuzzleDataUrl();
      if (!urlResult.url) {
        console.log('[RemotePuzzleLoader] No puzzle data URL configured in Remote Config');
        return;
      }

      console.log('[RemotePuzzleLoader] Puzzle data URL:', urlResult.url);

      // 3. Get expected version (optional validation)
      const versionResult = await RemoteConfig.getRemoteConfigValue({ key: 'puzzle_data_version' });
      const expectedVersion = versionResult.value;

      // 4. Download puzzle JSON
      const puzzleData = await this.downloadPuzzleData(urlResult.url);

      // 5. Validate downloaded data
      if (!puzzleDataManager.validatePuzzleData(puzzleData)) {
        console.error('[RemotePuzzleLoader] Downloaded puzzle data failed validation');
        return;
      }

      // 6. Update puzzles (will cache and apply based on game state)
      const updated = await puzzleDataManager.updatePuzzles(
        puzzleData,
        'remote',
        isGameInProgress
      );

      if (updated) {
        console.log('[RemotePuzzleLoader] Puzzles updated successfully');
      } else {
        console.log('[RemotePuzzleLoader] Update queued or no changes');
      }

      // 7. Verify version if expected version was provided
      if (expectedVersion) {
        const actualVersion = puzzleDataManager.getVersion().version;
        if (actualVersion !== expectedVersion) {
          console.warn(
            '[RemotePuzzleLoader] Version mismatch:',
            'expected', expectedVersion,
            'got', actualVersion
          );
        }
      }
    } catch (error) {
      console.error('[RemotePuzzleLoader] Update attempt failed:', error);

      // Retry with exponential backoff
      if (this.retryCount < this.maxRetries) {
        const delay = this.retryDelays[this.retryCount] || 4000;
        this.retryCount++;
        console.log(`[RemotePuzzleLoader] Retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.attemptUpdate(isGameInProgress);
      } else {
        console.error('[RemotePuzzleLoader] Max retries reached, giving up');
      }
    }
  }

  /**
   * Fetch Remote Config with timeout
   */
  private async fetchRemoteConfigWithTimeout(): Promise<void> {
    const timeout = 10000; // 10 seconds

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Remote Config fetch timeout')), timeout);
    });

    await Promise.race([
      RemoteConfig.fetchRemoteConfig(),
      timeoutPromise,
    ]);
  }

  /**
   * Download puzzle data from URL
   */
  private async downloadPuzzleData(url: string): Promise<PuzzleDataFile> {
    const timeout = 10000; // 10 seconds

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as PuzzleDataFile;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Puzzle download timeout');
      }
      throw error;
    }
  }

  /**
   * Apply any pending update
   */
  async applyPendingUpdate(): Promise<boolean> {
    return await puzzleDataManager.applyPendingUpdate();
  }

  /**
   * Check if update is in progress
   */
  isUpdating(): boolean {
    return this.updateInProgress;
  }

  /**
   * Reset retry counter
   */
  resetRetries(): void {
    this.retryCount = 0;
  }
}

// Export singleton instance
export const remotePuzzleLoader = new RemotePuzzleLoader();
