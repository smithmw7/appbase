/**
 * Player Data Types
 * Defines the structure for local and remote player data storage
 */

export interface PuzzleProgress {
  completed: boolean;
  bestTime?: number; // seconds to complete
  attempts: number;
  firstCompletedAt?: string; // ISO timestamp
  lastAttemptedAt?: string; // ISO timestamp
  perfectCompletions: number; // completed with 0 tiles remaining
}

export interface PlayerStats {
  totalPuzzlesCompleted: number;
  totalPuzzlesAttempted: number;
  currentStreak: number;
  maxStreak: number;
  totalPlayTime: number; // seconds
  lastPlayedAt: string | null; // ISO timestamp
  firstPlayedAt: string | null; // ISO timestamp
}

export interface EndlessModeStats {
  bestStreak: number;
  totalRoundsCompleted: number;
  bestStreakDate?: string; // ISO timestamp
}

export interface ActivitySession {
  startTime: string; // ISO timestamp
  endTime?: string; // ISO timestamp
  puzzlesPlayed: number;
  puzzlesCompleted: number;
}

export interface PlayerSettings {
  musicVolume: number;
  sfxVolume: number;
  hapticsEnabled: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export interface PlayerData {
  // Identity
  playerId: string; // Firebase UID (after auth) or local UUID
  createdAt: string; // ISO timestamp - first app launch
  lastSyncedAt: string | null; // ISO timestamp - last successful Firebase sync

  // Statistics
  stats: PlayerStats;

  // Puzzle Progress
  puzzleProgress: Record<string, PuzzleProgress>; // puzzleId format: "rackSize_index" e.g. "5_0", "7_12"

  // Endless Mode Stats
  endlessMode: EndlessModeStats;

  // Activity Tracking
  activity: {
    sessions: ActivitySession[];
    dailyActivity: Record<string, number>; // "YYYY-MM-DD" -> puzzles completed count
  };

  // Settings
  settings: PlayerSettings;
}

/**
 * Generate puzzle ID from rack size and index
 */
export function getPuzzleId(rackSize: number, index: number): string {
  return `${rackSize}_${index}`;
}

/**
 * Parse puzzle ID to rack size and index
 */
export function parsePuzzleId(puzzleId: string): { rackSize: number; index: number } | null {
  const parts = puzzleId.split('_');
  if (parts.length !== 2) return null;
  const rackSize = parseInt(parts[0], 10);
  const index = parseInt(parts[1], 10);
  if (isNaN(rackSize) || isNaN(index)) return null;
  return { rackSize, index };
}

/**
 * Create default/empty player data
 */
export function createDefaultPlayerData(playerId: string): PlayerData {
  const now = new Date().toISOString();
  return {
    playerId,
    createdAt: now,
    lastSyncedAt: null,
    stats: {
      totalPuzzlesCompleted: 0,
      totalPuzzlesAttempted: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalPlayTime: 0,
      lastPlayedAt: null,
      firstPlayedAt: null,
    },
    puzzleProgress: {},
    endlessMode: {
      bestStreak: 0,
      totalRoundsCompleted: 0,
    },
    activity: {
      sessions: [],
      dailyActivity: {},
    },
    settings: {
      musicVolume: 0.7,
      sfxVolume: 0.8,
      hapticsEnabled: true,
      musicEnabled: true,
      sfxEnabled: true,
    },
  };
}
