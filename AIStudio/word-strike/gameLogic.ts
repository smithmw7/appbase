
import { WORD_LENGTH } from './constants';
import { RAW_WORD_LIST } from './words';
import { TileData, LevelData, SolutionStep } from './types';

// Parse words from the single source of truth
const wordsArray = RAW_WORD_LIST.trim().split(/\s+/).map(w => w.trim().toLowerCase());

// Create valid word set
export const VALID_WORDS = new Set(wordsArray.filter(w => w.length === WORD_LENGTH));

const WORD_LIST = Array.from(VALID_WORDS);

export function isWordValid(word: string): boolean {
  return VALID_WORDS.has(word.toLowerCase());
}

// Generate a random ID for tiles
const generateId = () => Math.random().toString(36).substr(2, 9);

function getNeighbors(word: string, history: Set<string>): string[] {
  const neighbors: string[] = [];
  // Finding neighbors by iterating the whole list is O(N*L), with N~5000 it is fine.
  for (const w of WORD_LIST) {
    if (history.has(w)) continue;
    let diffCount = 0;
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (word[i] !== w[i]) diffCount++;
    }
    if (diffCount >= 1 && diffCount <= 3) {
      neighbors.push(w);
    }
  }
  return neighbors;
}

export function calculatePossibleMoves(currentWord: string, rackTiles: TileData[]): Record<number, string[]> {
  const rackCounts: Record<string, number> = {};
  for (const t of rackTiles) {
    rackCounts[t.char] = (rackCounts[t.char] || 0) + 1;
  }

  const movesByTileCount: Record<number, string[]> = {};
  const upperCurrentWord = currentWord.toUpperCase();

  for (const word of WORD_LIST) {
    const targetWord = word.toUpperCase();
    if (targetWord === upperCurrentWord) continue;

    const tempRack = { ...rackCounts };
    let possible = true;
    let tilesUsed = 0;

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (targetWord[i] !== upperCurrentWord[i]) {
        // We need to place a tile here.
        // Check if we have the tile in rack.
        if (tempRack[targetWord[i]] && tempRack[targetWord[i]] > 0) {
          tempRack[targetWord[i]]--;
          tilesUsed++;
        } else {
          possible = false;
          break;
        }
      }
    }

    if (possible && tilesUsed > 0) {
      if (!movesByTileCount[tilesUsed]) {
        movesByTileCount[tilesUsed] = [];
      }
      movesByTileCount[tilesUsed].push(targetWord);
    }
  }
  
  // Sort arrays
  Object.keys(movesByTileCount).forEach(key => {
      const k = Number(key);
      movesByTileCount[k].sort();
  });
  
  return movesByTileCount;
}

export function generateLevel(targetRackSize: number = 5): LevelData {
  const maxAttempts = 50;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Pick a random end word to start generation from
    const endWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    let currentWord = endWord;
    const rackChars: string[] = [];
    const history = new Set<string>([endWord]);
    const reverseSteps: SolutionStep[] = [];
    
    // We want exactly targetRackSize tiles.
    let stuck = false;
    let steps = 0;
    
    // Step backward from End Word -> Start Word
    while (rackChars.length < targetRackSize && steps < 20) {
      steps++;
      const neighbors = getNeighbors(currentWord, history);
      
      // Shuffle neighbors to get random path
      for (let i = neighbors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
      }
      
      let foundNext = false;
      for (const nextWord of neighbors) {
        let diff = 0;
        const newTiles: string[] = [];
        
        for(let k=0; k<WORD_LENGTH; k++) {
          if (currentWord[k] !== nextWord[k]) {
            diff++;
            newTiles.push(currentWord[k]);
          }
        }
        
        if (rackChars.length + diff <= targetRackSize) {
          rackChars.push(...newTiles);
          
          // Record the step: Predecessor -> Successor
          reverseSteps.push({
            fromWord: nextWord,
            targetWord: currentWord,
            tilesUsed: newTiles
          });
          
          currentWord = nextWord;
          history.add(currentWord);
          foundNext = true;
          break;
        }
      }
      
      if (!foundNext) {
        stuck = true;
        break;
      }
    }
    
    if (!stuck && rackChars.length === targetRackSize) {
      const solution = reverseSteps.reverse();
      
      return {
        startWord: currentWord.toUpperCase(),
        endWord: endWord.toUpperCase(),
        rackTiles: rackChars.map(c => ({ id: generateId(), char: c.toUpperCase() })),
        solution
      };
    }
  }
  
  // Fallback if generation fails
  const fallbackRack: TileData[] = [
    { id: '1', char: 'S' }
  ];
  // Fill remaining slots with random letters if needed to match requested size
  while (fallbackRack.length < targetRackSize) {
      const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      fallbackRack.push({ id: generateId(), char: randomChar });
  }

  return {
    startWord: "PLATE",
    endWord: "SLATE", 
    rackTiles: fallbackRack,
    solution: [
       { fromWord: "PLATE", targetWord: "SLATE", tilesUsed: ['S'] }
    ]
  };
}

// Generates the NEXT round for endless mode starting from the given word
export function generateNextRound(startWord: string, targetRackSize: number): LevelData | null {
  const maxAttempts = 20;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let currentWord = startWord.toLowerCase();
    const rackChars: string[] = [];
    const history = new Set<string>([currentWord]);
    const forwardSteps: SolutionStep[] = [];
    
    let stuck = false;
    let steps = 0;
    
    // Step forward from Start Word -> Some Target End Word
    while (rackChars.length < targetRackSize && steps < 20) {
      steps++;
      const neighbors = getNeighbors(currentWord, history);
      
      // Shuffle neighbors
      for (let i = neighbors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
      }
      
      let foundNext = false;
      for (const nextWord of neighbors) {
        let diff = 0;
        const newTiles: string[] = [];
        
        for(let k=0; k<WORD_LENGTH; k++) {
          if (currentWord[k] !== nextWord[k]) {
            diff++;
            newTiles.push(nextWord[k]); // Use the letters from the NEXT word
          }
        }
        
        if (rackChars.length + diff <= targetRackSize) {
          rackChars.push(...newTiles);
          
          forwardSteps.push({
            fromWord: currentWord.toUpperCase(),
            targetWord: nextWord.toUpperCase(),
            tilesUsed: newTiles.map(c => c.toUpperCase())
          });
          
          currentWord = nextWord;
          history.add(currentWord);
          foundNext = true;
          break;
        }
      }
      
      if (!foundNext) {
        stuck = true;
        break;
      }
    }
    
    if (!stuck && rackChars.length === targetRackSize) {
      return {
        startWord: startWord.toUpperCase(),
        endWord: currentWord.toUpperCase(), // The last word reached is the "goal" conceptually, though user just needs to use tiles
        rackTiles: rackChars.map(c => ({ id: generateId(), char: c.toUpperCase() })),
        solution: forwardSteps
      };
    }
  }
  
  return null;
}
