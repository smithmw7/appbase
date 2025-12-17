/**
 * PuzzleDataManager
 * Manages puzzle data loading, versioning, and caching
 */

import type {
  PuzzleDataFile,
  VersionedPuzzleData,
  PuzzleDataVersion,
  RawPuzzleData,
} from '../types/PuzzleData';
import { validatePuzzleData, extractRackSizes } from '../types/PuzzleData';
import puzzlesJSON from '../puzzles.json';

// LocalStorage plugin interface (extend existing)
interface LocalStoragePluginExtended {
  getPuzzleCache(): Promise<{ data: any | null }>;
  savePuzzleCache(options: { data: any }): Promise<void>;
  clearPuzzleCache(): Promise<void>;
}

function getLocalStoragePlugin(): LocalStoragePluginExtended | null {
  return (window as any).LocalStorage || null;
}

class PuzzleDataManager {
  private activePuzzles: VersionedPuzzleData | null = null;
  private pendingUpdate: VersionedPuzzleData | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize and load puzzle data
   * Priority: Cache → Local bundled
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.activePuzzles) {
      return;
    }

    try {
      // Try to load from cache first
      const cachedPuzzles = await this.loadCachedPuzzles();
      if (cachedPuzzles) {
        console.log('[PuzzleDataManager] Loaded puzzles from cache:', cachedPuzzles.version);
        this.activePuzzles = cachedPuzzles;
        this.isInitialized = true;
        return;
      }
    } catch (error) {
      console.warn('[PuzzleDataManager] Failed to load cached puzzles:', error);
    }

    // Fallback to bundled puzzles
    const bundledPuzzles = this.loadBundledPuzzles();
    console.log('[PuzzleDataManager] Loaded bundled puzzles:', bundledPuzzles.version);
    this.activePuzzles = bundledPuzzles;
    this.isInitialized = true;
  }

  /**
   * Load bundled puzzles.json from app bundle
   */
  loadBundledPuzzles(): VersionedPuzzleData {
    const data = puzzlesJSON as PuzzleDataFile;

    if (!validatePuzzleData(data)) {
      throw new Error('Invalid bundled puzzle data');
    }

    const version: PuzzleDataVersion = {
      version: this.calculateVersion(data),
      timestamp: new Date().toISOString(),
      source: 'local',
      puzzleCount: data.puzzles.length,
      rackSizes: extractRackSizes(data),
    };

    return { version, data };
  }

  /**
   * Load cached puzzles from LocalStorage
   */
  async loadCachedPuzzles(): Promise<VersionedPuzzleData | null> {
    try {
      const plugin = getLocalStoragePlugin();
      if (!plugin) {
        return null;
      }

      const result = await plugin.getPuzzleCache();
      if (!result.data) {
        return null;
      }

      const cached = result.data as VersionedPuzzleData;

      // Validate cached data
      if (!cached.version || !cached.data) {
        console.warn('[PuzzleDataManager] Invalid cached puzzle structure');
        return null;
      }

      if (!validatePuzzleData(cached.data)) {
        console.warn('[PuzzleDataManager] Cached puzzle data failed validation');
        return null;
      }

      // Mark as cached source
      cached.version.source = 'cached';

      return cached;
    } catch (error) {
      console.error('[PuzzleDataManager] Error loading cached puzzles:', error);
      return null;
    }
  }

  /**
   * Save puzzles to cache
   */
  async savePuzzlesToCache(versionedData: VersionedPuzzleData): Promise<void> {
    try {
      const plugin = getLocalStoragePlugin();
      if (!plugin) {
        console.warn('[PuzzleDataManager] LocalStorage plugin not available');
        return;
      }

      await plugin.savePuzzleCache({ data: versionedData });
      console.log('[PuzzleDataManager] Saved puzzles to cache:', versionedData.version.version);
    } catch (error) {
      console.error('[PuzzleDataManager] Failed to save puzzles to cache:', error);
    }
  }

  /**
   * Clear puzzle cache
   */
  async clearCache(): Promise<void> {
    try {
      const plugin = getLocalStoragePlugin();
      if (!plugin) {
        return;
      }

      await plugin.clearPuzzleCache();
      console.log('[PuzzleDataManager] Cleared puzzle cache');

      // Reset to bundled puzzles
      this.activePuzzles = this.loadBundledPuzzles();
    } catch (error) {
      console.error('[PuzzleDataManager] Failed to clear cache:', error);
    }
  }

  /**
   * Calculate SHA-256 hash of puzzle data for versioning
   */
  calculateVersion(data: PuzzleDataFile): string {
    // Simple hash function for versioning
    // In production, use crypto.subtle.digest for proper SHA-256
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Calculate proper SHA-256 hash using Web Crypto API
   */
  async calculateVersionAsync(data: PuzzleDataFile): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.warn('[PuzzleDataManager] Web Crypto API unavailable, using fallback hash');
      return this.calculateVersion(data);
    }
  }

  /**
   * Validate puzzle data structure
   */
  validatePuzzleData(data: any): boolean {
    return validatePuzzleData(data);
  }

  /**
   * Get active puzzles
   */
  getActivePuzzles(): RawPuzzleData[] {
    if (!this.activePuzzles) {
      throw new Error('PuzzleDataManager not initialized');
    }
    return this.activePuzzles.data.puzzles;
  }

  /**
   * Get active puzzle version info
   */
  getVersion(): PuzzleDataVersion {
    if (!this.activePuzzles) {
      throw new Error('PuzzleDataManager not initialized');
    }
    return this.activePuzzles.version;
  }

  /**
   * Update puzzles from remote source
   * This will queue the update if game is in progress
   */
  async updatePuzzles(
    newData: PuzzleDataFile,
    source: 'remote',
    isGameInProgress: boolean
  ): Promise<boolean> {
    // Validate new data
    if (!validatePuzzleData(newData)) {
      console.error('[PuzzleDataManager] Invalid puzzle data from remote');
      return false;
    }

    const version: PuzzleDataVersion = {
      version: await this.calculateVersionAsync(newData),
      timestamp: new Date().toISOString(),
      source,
      puzzleCount: newData.puzzles.length,
      rackSizes: extractRackSizes(newData),
    };

    const versionedData: VersionedPuzzleData = { version, data: newData };

    // Check if this is actually a new version
    if (this.activePuzzles && version.version === this.activePuzzles.version.version) {
      console.log('[PuzzleDataManager] Remote data is same version, skipping update');
      return false;
    }

    // Save to cache
    await this.savePuzzlesToCache(versionedData);

    if (isGameInProgress) {
      // Queue for next launch
      this.pendingUpdate = versionedData;
      console.log('[PuzzleDataManager] Update queued (game in progress)');
      return false;
    } else {
      // Hot swap immediately
      this.activePuzzles = versionedData;
      console.log('[PuzzleDataManager] Puzzles updated to version:', version.version);
      return true;
    }
  }

  /**
   * Apply pending update if available
   */
  async applyPendingUpdate(): Promise<boolean> {
    if (!this.pendingUpdate) {
      return false;
    }

    this.activePuzzles = this.pendingUpdate;
    this.pendingUpdate = null;
    console.log('[PuzzleDataManager] Applied pending puzzle update');
    return true;
  }

  /**
   * Check if there is a pending update
   */
  hasPendingUpdate(): boolean {
    return this.pendingUpdate !== null;
  }

  /**
   * Get pending update version info
   */
  getPendingUpdateVersion(): PuzzleDataVersion | null {
    return this.pendingUpdate?.version || null;
  }
}

// Export singleton instance
export const puzzleDataManager = new PuzzleDataManager();
