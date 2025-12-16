
export interface TileData {
  id: string;
  char: string;
}

export type SlotState = 'empty' | 'locked' | 'staged';

export interface BoardSlot {
  index: number;
  lockedChar: string;
  stagedTile: TileData | null;
}

export type GameStatus = 'loading' | 'playing' | 'won' | 'lost' | 'start_screen' | 'round_won';

export interface SolutionStep {
  fromWord: string;
  targetWord: string;
  tilesUsed: string[];
}

export interface LevelData {
  startWord: string;
  endWord: string;
  rackTiles: TileData[];
  solution: SolutionStep[];
}

export type DragSource = {
  type: 'rack' | 'board';
  index: number; // Index in rack array or board slot index
};

export interface DragState {
  isDragging: boolean;
  tile: TileData | null;
  source: DragSource | null;
  x: number;
  y: number;
  touchId?: number;
}
