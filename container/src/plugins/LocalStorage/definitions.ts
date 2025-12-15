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
}
