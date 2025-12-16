/**
 * PlayerDataManager
 * Manages local player data storage and game event tracking
 */

import type { PlayerData, PuzzleProgress, ActivitySession } from '../types/PlayerData';
import { createDefaultPlayerData, getPuzzleId } from '../types/PlayerData';

// Get LocalStorage plugin from Capacitor
declare global {
  interface Window {
    LocalStorage?: {
      getPlayerData(): Promise<{ data: any | null }>;
      savePlayerData(data: { data: any }): Promise<void>;
      updatePlayerStats(stats: { stats: any }): Promise<void>;
      updatePuzzleProgress(data: { puzzleId: string; progress: any }): Promise<void>;
      recordActivity(data: { session: any }): Promise<void>;
    };
  }
}

class PlayerDataManager {
  private playerData: PlayerData | null = null;
  private isInitialized: boolean = false;
  private sessionStartTime: Date | null = null;
  private sessionPuzzlesPlayed: number = 0;
  private sessionPuzzlesCompleted: number = 0;

  /**
   * Initialize and load player data
   */
  async initialize(playerId: string): Promise<PlayerData> {
    if (this.isInitialized && this.playerData) {
      return this.playerData;
    }

    try {
      const plugin = window.LocalStorage;
      if (!plugin) {
        console.warn('LocalStorage plugin not available, using default data');
        this.playerData = createDefaultPlayerData(playerId);
        this.isInitialized = true;
        return this.playerData;
      }

      const result = await plugin.getPlayerData();
      if (result.data) {
        this.playerData = result.data as PlayerData;
        // Ensure playerId matches
        this.playerData.playerId = playerId;
      } else {
        // Create new player data
        this.playerData = createDefaultPlayerData(playerId);
        await this.save();
      }

      this.isInitialized = true;
      return this.playerData;
    } catch (error) {
      console.error('Failed to initialize player data:', error);
      this.playerData = createDefaultPlayerData(playerId);
      this.isInitialized = true;
      return this.playerData;
    }
  }

  /**
   * Get current player data
   */
  getPlayerData(): PlayerData {
    if (!this.playerData) {
      throw new Error('PlayerDataManager not initialized');
    }
    return this.playerData;
  }

  /**
   * Save player data to local storage
   */
  async save(): Promise<void> {
    if (!this.playerData) {
      return;
    }

    try {
      const plugin = window.LocalStorage;
      if (!plugin) {
        console.warn('LocalStorage plugin not available, cannot save');
        return;
      }

      await plugin.savePlayerData({ data: this.playerData });
    } catch (error) {
      console.error('Failed to save player data:', error);
    }
  }

  /**
   * Track puzzle start
   */
  async onPuzzleStart(rackSize: number, puzzleIndex: number): Promise<void> {
    if (!this.playerData) return;

    const puzzleId = getPuzzleId(rackSize, puzzleIndex);
    const now = new Date().toISOString();

    // Start session if not started
    if (!this.sessionStartTime) {
      this.sessionStartTime = new Date();
      this.sessionPuzzlesPlayed = 0;
      this.sessionPuzzlesCompleted = 0;
    }

    this.sessionPuzzlesPlayed++;

    // Update puzzle progress
    const progress = this.playerData.puzzleProgress[puzzleId] || {
      completed: false,
      attempts: 0,
      perfectCompletions: 0,
    };
    progress.attempts = (progress.attempts || 0) + 1;
    progress.lastAttemptedAt = now;
    this.playerData.puzzleProgress[puzzleId] = progress;

    // Update stats
    this.playerData.stats.totalPuzzlesAttempted++;
    this.playerData.stats.lastPlayedAt = now;
    if (!this.playerData.stats.firstPlayedAt) {
      this.playerData.stats.firstPlayedAt = now;
    }

    // Save puzzle progress
    try {
      const plugin = window.LocalStorage;
      if (plugin) {
        await plugin.updatePuzzleProgress({
          puzzleId,
          progress: {
            attempts: progress.attempts,
            lastAttemptedAt: progress.lastAttemptedAt,
          },
        });
      }
    } catch (error) {
      console.error('Failed to update puzzle progress:', error);
    }

    await this.save();
  }

  /**
   * Track puzzle completion
   */
  async onPuzzleComplete(
    rackSize: number,
    puzzleIndex: number,
    timeToComplete: number,
    tilesRemaining: number
  ): Promise<void> {
    if (!this.playerData) return;

    const puzzleId = getPuzzleId(rackSize, puzzleIndex);
    const now = new Date().toISOString();
    const isPerfect = tilesRemaining === 0;
    const wasFirstCompletion = !this.playerData.puzzleProgress[puzzleId]?.completed;

    // Update puzzle progress
    const progress = this.playerData.puzzleProgress[puzzleId] || {
      completed: false,
      attempts: 0,
      perfectCompletions: 0,
    };
    progress.completed = true;
    if (!progress.firstCompletedAt) {
      progress.firstCompletedAt = now;
    }
    if (!progress.bestTime || timeToComplete < progress.bestTime) {
      progress.bestTime = timeToComplete;
    }
    if (isPerfect) {
      progress.perfectCompletions = (progress.perfectCompletions || 0) + 1;
    }
    this.playerData.puzzleProgress[puzzleId] = progress;

    // Update stats
    if (wasFirstCompletion) {
      this.playerData.stats.totalPuzzlesCompleted++;
    }
    this.playerData.stats.lastPlayedAt = now;
    this.sessionPuzzlesCompleted++;

    // Update daily activity
    const today = new Date().toISOString().split('T')[0];
    this.playerData.activity.dailyActivity[today] =
      (this.playerData.activity.dailyActivity[today] || 0) + 1;

    // Save puzzle progress
    try {
      const plugin = window.LocalStorage;
      if (plugin) {
        await plugin.updatePuzzleProgress({
          puzzleId,
          progress: {
            completed: progress.completed,
            bestTime: progress.bestTime,
            firstCompletedAt: progress.firstCompletedAt,
            perfectCompletions: progress.perfectCompletions,
          },
        });
      }
    } catch (error) {
      console.error('Failed to update puzzle progress:', error);
    }

    await this.save();
  }

  /**
   * Track puzzle loss (game over)
   */
  async onPuzzleLost(_rackSize: number, _puzzleIndex: number): Promise<void> {
    if (!this.playerData) return;

    // Reset current streak
    this.playerData.stats.currentStreak = 0;
    await this.save();
  }

  /**
   * Update streak (for endless mode)
   */
  async updateStreak(streak: number): Promise<void> {
    if (!this.playerData) return;

    this.playerData.stats.currentStreak = streak;
    if (streak > this.playerData.stats.maxStreak) {
      this.playerData.stats.maxStreak = streak;
    }

    // Update endless mode best streak
    if (streak > this.playerData.endlessMode.bestStreak) {
      this.playerData.endlessMode.bestStreak = streak;
      this.playerData.endlessMode.bestStreakDate = new Date().toISOString();
    }

    try {
      const plugin = window.LocalStorage;
      if (plugin) {
        await plugin.updatePlayerStats({
          stats: {
            currentStreak: this.playerData.stats.currentStreak,
            maxStreak: this.playerData.stats.maxStreak,
          },
        });
      }
    } catch (error) {
      console.error('Failed to update stats:', error);
    }

    await this.save();
  }

  /**
   * Track endless mode round completion
   */
  async onEndlessRoundComplete(): Promise<void> {
    if (!this.playerData) return;

    this.playerData.endlessMode.totalRoundsCompleted++;
    await this.save();
  }

  /**
   * Start activity session
   */
  startSession(): void {
    if (this.sessionStartTime) {
      return; // Session already started
    }
    this.sessionStartTime = new Date();
    this.sessionPuzzlesPlayed = 0;
    this.sessionPuzzlesCompleted = 0;
  }

  /**
   * End activity session
   */
  async endSession(): Promise<void> {
    if (!this.sessionStartTime || !this.playerData) {
      return;
    }

    const session: ActivitySession = {
      startTime: this.sessionStartTime.toISOString(),
      endTime: new Date().toISOString(),
      puzzlesPlayed: this.sessionPuzzlesPlayed,
      puzzlesCompleted: this.sessionPuzzlesCompleted,
    };

    this.playerData.activity.sessions.push(session);

    // Keep only last 100 sessions
    if (this.playerData.activity.sessions.length > 100) {
      this.playerData.activity.sessions = this.playerData.activity.sessions.slice(-100);
    }

    try {
      const plugin = window.LocalStorage;
      if (plugin) {
        await plugin.recordActivity({ session });
      }
    } catch (error) {
      console.error('Failed to record activity:', error);
    }

    this.sessionStartTime = null;
    this.sessionPuzzlesPlayed = 0;
    this.sessionPuzzlesCompleted = 0;

    await this.save();
  }

  /**
   * Update play time (call periodically during gameplay)
   */
  async addPlayTime(seconds: number): Promise<void> {
    if (!this.playerData) return;

    this.playerData.stats.totalPlayTime += seconds;
    await this.save();
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<PlayerData['settings']>): Promise<void> {
    if (!this.playerData) return;

    this.playerData.settings = {
      ...this.playerData.settings,
      ...settings,
    };
    await this.save();
  }

  /**
   * Set last synced timestamp
   */
  setLastSyncedAt(timestamp: string): void {
    if (!this.playerData) return;
    this.playerData.lastSyncedAt = timestamp;
  }

  /**
   * Get data for Firebase sync (minimal structure)
   */
  getFirebaseData(): any {
    if (!this.playerData) return null;

    return {
      playerId: this.playerData.playerId,
      createdAt: this.playerData.createdAt,
      lastSyncedAt: this.playerData.lastSyncedAt || new Date().toISOString(),
      stats: {
        totalPuzzlesCompleted: this.playerData.stats.totalPuzzlesCompleted,
        maxStreak: this.playerData.stats.maxStreak,
        totalPlayTime: this.playerData.stats.totalPlayTime,
        lastPlayedAt: this.playerData.stats.lastPlayedAt,
      },
      puzzleProgress: Object.fromEntries(
        Object.entries(this.playerData.puzzleProgress).map(([id, progress]) => [
          id,
          {
            completed: progress.completed,
            bestTime: progress.bestTime,
            perfectCompletions: progress.perfectCompletions,
            firstCompletedAt: progress.firstCompletedAt,
          },
        ])
      ),
      endlessMode: {
        bestStreak: this.playerData.endlessMode.bestStreak,
      },
      settings: {
        musicVolume: this.playerData.settings.musicVolume,
        sfxVolume: this.playerData.settings.sfxVolume,
        hapticsEnabled: this.playerData.settings.hapticsEnabled,
      },
    };
  }

  /**
   * Merge Firebase data into local data
   */
  mergeFirebaseData(firebaseData: any): void {
    if (!this.playerData || !firebaseData) return;

    // Merge stats (take maximums)
    if (firebaseData.stats) {
      this.playerData.stats.maxStreak = Math.max(
        this.playerData.stats.maxStreak,
        firebaseData.stats.maxStreak || 0
      );
      this.playerData.stats.totalPuzzlesCompleted = Math.max(
        this.playerData.stats.totalPuzzlesCompleted,
        firebaseData.stats.totalPuzzlesCompleted || 0
      );
      this.playerData.stats.totalPlayTime = Math.max(
        this.playerData.stats.totalPlayTime,
        firebaseData.stats.totalPlayTime || 0
      );
      if (firebaseData.stats.lastPlayedAt) {
        const firebaseLast = new Date(firebaseData.stats.lastPlayedAt);
        const localLast = this.playerData.stats.lastPlayedAt
          ? new Date(this.playerData.stats.lastPlayedAt)
          : null;
        if (!localLast || firebaseLast >= localLast) {
          this.playerData.stats.lastPlayedAt = firebaseData.stats.lastPlayedAt;
        }
      }
    }

    // Merge puzzle progress
    if (firebaseData.puzzleProgress) {
      for (const [puzzleId, remoteProgress] of Object.entries(firebaseData.puzzleProgress)) {
        const local = this.playerData.puzzleProgress[puzzleId];
        if (!local || !local.completed) {
          // Use remote if local doesn't exist or isn't completed
          this.playerData.puzzleProgress[puzzleId] = {
            ...(remoteProgress as PuzzleProgress),
            attempts: local?.attempts || 0,
            lastAttemptedAt: local?.lastAttemptedAt,
          };
        } else {
          // Merge: prefer better times, more perfect completions
          const remote = remoteProgress as PuzzleProgress;
          if (remote.bestTime && (!local.bestTime || remote.bestTime < local.bestTime)) {
            local.bestTime = remote.bestTime;
          }
          if (remote.perfectCompletions > (local.perfectCompletions || 0)) {
            local.perfectCompletions = remote.perfectCompletions;
          }
        }
      }
    }

    // Merge endless mode
    if (firebaseData.endlessMode) {
      this.playerData.endlessMode.bestStreak = Math.max(
        this.playerData.endlessMode.bestStreak,
        firebaseData.endlessMode.bestStreak || 0
      );
    }

    // Update last synced
    if (firebaseData.lastSyncedAt) {
      this.playerData.lastSyncedAt = firebaseData.lastSyncedAt;
    }
  }
}

// Export singleton instance
export const playerDataManager = new PlayerDataManager();
