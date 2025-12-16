
import { LevelData, TileData, SolutionStep } from './types';
import { generateLevel } from './gameLogic';

// Hardcoded data from puzzles.json
const PREMADE_PUZZLES_SOURCE = [
  {
    "start": "about",
    "rack": ["e", "n", "s", "h", "r"],
    "path": ["abort", "snort", "short", "shore"],
    "endWord": "shore"
  },
  {
    "start": "dance",
    "rack": ["s", "r", "l", "u", "g"],
    "path": ["lance", "lunge", "lungs", "rungs"],
    "endWord": "rungs"
  }
];

// Helper to convert simple string paths into the game's SolutionStep format
function convertPathToSolution(startWord: string, path: string[]): SolutionStep[] {
  const steps: SolutionStep[] = [];
  let current = startWord;
  
  for (const target of path) {
    const tilesUsed: string[] = [];
    const upperCurrent = current.toUpperCase();
    const upperTarget = target.toUpperCase();
    
    // Determine which tiles changed
    for (let i = 0; i < 5; i++) {
      if (upperCurrent[i] !== upperTarget[i]) {
        tilesUsed.push(upperTarget[i]);
      }
    }
    
    steps.push({
      fromWord: upperCurrent,
      targetWord: upperTarget,
      tilesUsed
    });
    current = target;
  }
  return steps;
}

// We maintain separate banks for different rack sizes
let PUZZLE_BANK_5: LevelData[] = [];
let PUZZLE_BANK_7: LevelData[] = [];
const BANK_SIZE = 30;

const ensureBank = (rackSize: number) => {
  const bank = rackSize === 7 ? PUZZLE_BANK_7 : PUZZLE_BANK_5;
  
  if (bank.length === 0) {
    // Inject premade puzzles FIRST if we are filling the 5-tile bank
    if (rackSize === 5) {
      PREMADE_PUZZLES_SOURCE.forEach(data => {
         const rackTiles: TileData[] = data.rack.map(c => ({
            id: Math.random().toString(36).substr(2, 9),
            char: c.toUpperCase()
         }));
         
         const solution = convertPathToSolution(data.start, data.path);
         
         bank.push({
           startWord: data.start.toUpperCase(),
           endWord: data.endWord.toUpperCase(),
           rackTiles,
           solution
         });
      });
    }

    // Fill the rest with generated levels up to BANK_SIZE
    while (bank.length < BANK_SIZE) {
      bank.push(generateLevel(rackSize));
    }
  }
  return bank;
};

export const getPuzzleBank = (rackSize: number): LevelData[] => {
  return ensureBank(rackSize);
};

export const getPuzzleByIndex = (index: number, rackSize: number): LevelData | null => {
  const bank = ensureBank(rackSize);
  
  if (index >= 0 && index < bank.length) {
    // Return a deep copy to ensure the "Asset" isn't mutated by gameplay
    const level = bank[index];
    
    // We must regenerate tile IDs on load so React treats them as new objects
    // otherwise dragging logic can get confused if we replay the same level object
    return {
      ...level,
      rackTiles: level.rackTiles.map(t => ({ 
        ...t, 
        id: Math.random().toString(36).substr(2, 9) 
      }))
    };
  }
  return null;
};
