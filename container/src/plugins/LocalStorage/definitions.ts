/**
 * TypeScript definitions for Local Storage plugin (SQLite)
 */

export interface LocalStoragePlugin {
  /**
   * Initialize the database and run migrations
   */
  initialize(): Promise<void>;

  /**
   * Get puzzle data by ID
   */
  getPuzzle(id: string): Promise<{ puzzle: any | null }>;

  /**
   * Save puzzle data
   */
  savePuzzle(puzzle: {
    id: string;
    date: string;
    data: any;
    completed: boolean;
    timeToComplete?: number;
  }): Promise<void>;

  /**
   * Get player stats
   */
  getPlayerStats(): Promise<{
    streak: number;
    maxStreak: number;
    histogram: Record<string, number>;
  }>;

  /**
   * Update player stats
   */
  updatePlayerStats(stats: {
    streak?: number;
    maxStreak?: number;
    histogram?: Record<string, number>;
  }): Promise<void>;

  /**
   * Get settings
   */
  getSettings(): Promise<{
    sound: boolean;
    haptics: boolean;
    colorblind: boolean;
    tutorialCompleted: boolean;
  }>;

  /**
   * Update settings
   */
  updateSettings(settings: {
    sound?: boolean;
    haptics?: boolean;
    colorblind?: boolean;
    tutorialCompleted?: boolean;
  }): Promise<void>;

  /**
   * Get complete player data blob
   */
  getPlayerData(): Promise<any | null>;

  /**
   * Save complete player data blob
   */
  savePlayerData(data: any): Promise<void>;

  /**
   * Update player stats (partial update)
   */
  updatePlayerStats(stats: {
    totalPuzzlesCompleted?: number;
    totalPuzzlesAttempted?: number;
    currentStreak?: number;
    maxStreak?: number;
    totalPlayTime?: number;
    lastPlayedAt?: string | null;
    firstPlayedAt?: string | null;
  }): Promise<void>;

  /**
   * Update puzzle progress for a specific puzzle
   */
  updatePuzzleProgress(puzzleId: string, progress: {
    completed?: boolean;
    bestTime?: number;
    attempts?: number;
    firstCompletedAt?: string;
    lastAttemptedAt?: string;
    perfectCompletions?: number;
  }): Promise<void>;

  /**
   * Record an activity session
   */
  recordActivity(session: {
    startTime: string;
    endTime?: string;
    puzzlesPlayed: number;
    puzzlesCompleted: number;
  }): Promise<void>;
}
