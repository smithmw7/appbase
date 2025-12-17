/**
 * Puzzle Data Types
 * Defines the structure for versioned puzzle data with remote config support
 */

export interface PuzzleDataVersion {
  version: string; // SHA-256 hash of JSON content
  timestamp: string; // ISO timestamp
  source: 'local' | 'remote' | 'cached';
  puzzleCount: number;
  rackSizes: number[];
}

export interface RawPuzzleData {
  start: string;
  rack: string[];
  total_solutions?: number;
  total_paths?: number;
  // Solution paths (S_4, S_3, etc.)
  S_5?: string[][];
  S_4?: string[][];
  S_3?: string[][];
  S_2?: string[][];
  S_1?: string[][];
  // Perfect paths (P_4, P_3, etc.)
  P_5?: string[][];
  P_4?: string[][];
  P_3?: string[][];
  P_2?: string[][];
  P_1?: string[][];
  // Counts
  C_S_5?: number;
  C_S_4?: number;
  C_S_3?: number;
  C_S_2?: number;
  C_S_1?: number;
  C_P_5?: number;
  C_P_4?: number;
  C_P_3?: number;
  C_P_2?: number;
  C_P_1?: number;
}

export interface PuzzleDataFile {
  version?: string; // Semantic version (e.g., "1.0.0")
  createdAt?: string; // ISO timestamp
  description?: string; // Human-readable description
  puzzleCount?: number; // Total number of puzzles
  rackSizes?: number[]; // Array of rack sizes included
  puzzles: RawPuzzleData[];
}

export interface VersionedPuzzleData {
  version: PuzzleDataVersion;
  data: PuzzleDataFile;
}

export interface PuzzleCacheMetadata {
  version: string;
  timestamp: string;
  source: 'remote' | 'local';
  puzzleCount: number;
  dataSize: number; // Size in bytes
}

/**
 * Validate puzzle data structure
 */
export function validatePuzzleData(data: any): data is PuzzleDataFile {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (!Array.isArray(data.puzzles)) {
    return false;
  }

  if (data.puzzles.length === 0) {
    return false;
  }

  // Validate metadata if present
  if (data.version !== undefined && typeof data.version !== 'string') {
    return false;
  }
  if (data.createdAt !== undefined && typeof data.createdAt !== 'string') {
    return false;
  }
  if (data.description !== undefined && typeof data.description !== 'string') {
    return false;
  }
  if (data.puzzleCount !== undefined && typeof data.puzzleCount !== 'number') {
    return false;
  }
  if (data.rackSizes !== undefined && !Array.isArray(data.rackSizes)) {
    return false;
  }

  // Validate each puzzle has required fields
  for (const puzzle of data.puzzles) {
    if (!puzzle.start || typeof puzzle.start !== 'string') {
      return false;
    }
    if (!Array.isArray(puzzle.rack)) {
      return false;
    }
    if (puzzle.rack.length === 0) {
      return false;
    }
    // Check rack contains valid characters
    for (const char of puzzle.rack) {
      if (typeof char !== 'string' || char.length !== 1) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Extract rack sizes from puzzle data
 */
export function extractRackSizes(data: PuzzleDataFile): number[] {
  const sizes = new Set<number>();
  for (const puzzle of data.puzzles) {
    sizes.add(puzzle.rack.length);
  }
  return Array.from(sizes).sort((a, b) => a - b);
}
