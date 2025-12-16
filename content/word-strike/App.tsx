
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { isWordValid, calculatePossibleMoves, generateNextRound } from './gameLogic';
import { getPuzzleBank, getPuzzleByIndex } from './assets';
import { TileData, BoardSlot, DragState, GameStatus, LevelData } from './types';
import { COLORS } from './constants';
import { App as CapacitorApp } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('start_screen');
  const [currentLevel, setCurrentLevel] = useState<LevelData | null>(null);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(0);
  const [currentRackSize, setCurrentRackSize] = useState<number>(5);
  const [boardSlots, setBoardSlots] = useState<BoardSlot[]>([]);
  const [rackTiles, setRackTiles] = useState<TileData[]>([]);
  const [shake, setShake] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Endless Mode State
  const [isEndlessMode, setIsEndlessMode] = useState(false);
  const [streak, setStreak] = useState(0);
  
  // Custom Puzzle State
  const [customStartWord, setCustomStartWord] = useState('');
  const [customRackString, setCustomRackString] = useState('');
  const [customLevelData, setCustomLevelData] = useState<LevelData | null>(null);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [appInfo, setAppInfo] = useState<{ version: string; build: number } | null>(null);
  const [appInfoError, setAppInfoError] = useState<string | null>(null);
  const [hapticsError, setHapticsError] = useState<string | null>(null);
  const [undoJustUsed, setUndoJustUsed] = useState(false);
  
  const [possibleMoves, setPossibleMoves] = useState<Record<number, string[]> | null>(null);
  const [wordHistory, setWordHistory] = useState<string[]>([]);
  
  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    tile: null,
    source: null,
    x: 0,
    y: 0
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch app info on mount (direct Capacitor call, no bridge)
  useEffect(() => {
    const fetchAppInfo = async () => {
      try {
        const info = await CapacitorApp.getInfo();
        const build = typeof info.build === 'number' ? info.build : Number.parseInt(String(info.build), 10);
        setAppInfo({ version: info.version, build: Number.isFinite(build) ? build : 1 });
        setAppInfoError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('Failed to fetch app info:', error);
        setAppInfo(null);
        setAppInfoError(message);
      }
    };
    fetchAppInfo();
  }, []);

  const triggerHaptic = useCallback(
    async (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
      if (!hapticsEnabled) return;
      try {
        if (type === 'success') {
          await Haptics.notification({ type: NotificationType.Success });
        } else if (type === 'error') {
          await Haptics.notification({ type: NotificationType.Error });
        } else {
          const style = type === 'light' ? ImpactStyle.Light : type === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy;
          await Haptics.impact({ style });
        }
        setHapticsError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('Haptic trigger failed', error);
        setHapticsError(message);
      }
    },
    [hapticsEnabled]
  );
  
  // Initialize game
  const loadPuzzle = useCallback((index: number, rackSize: number) => {
    setStatus('loading');
    setWordHistory([]); // Reset history
    setPossibleMoves(null); // Reset moves
    setStreak(0); // Reset streak on new standard puzzle
    setUndoJustUsed(false); // Reset undo state
    
    // Small delay to allow UI to show loading
    setTimeout(() => {
      let level: LevelData | null = null;
      if (index === -1 && customLevelData) {
        // Reload the custom level data
        level = {
            ...customLevelData,
            rackTiles: customLevelData.rackTiles.map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9) }))
        };
      } else {
        level = getPuzzleByIndex(index, rackSize);
      }

      if (level) {
        setCurrentLevel(level);
        setCurrentPuzzleIndex(index);
        
        const slots: BoardSlot[] = level.startWord.split('').map((char, index) => ({
          index,
          lockedChar: char.toUpperCase(),
          stagedTile: null
        }));
        setBoardSlots(slots);
        setRackTiles(level.rackTiles);
        setWordHistory([level.startWord]); // Start history with the initial word
        setStatus('playing');
        setUndoJustUsed(false); // Ensure undo is reset when game starts
      }
    }, 100);
  }, [customLevelData]);

  useEffect(() => {
    // Ensure bank is generated for the current size
    getPuzzleBank(currentRackSize);
  }, [currentRackSize]);

  const handleRackSizeChange = (size: number) => {
    if (size !== currentRackSize) {
      triggerHaptic('light');
      setCurrentRackSize(size);
      // If we are currently playing standard mode, reload with the new size
      if (status !== 'start_screen' && !isEndlessMode) {
        loadPuzzle(0, size);
      }
    }
  };

  const handleStartGame = () => {
    triggerHaptic('light');
    if (isEndlessMode) {
      // Endless mode starts with a random puzzle, then continues
      const bank = getPuzzleBank(currentRackSize);
      const randomIndex = Math.floor(Math.random() * bank.length);
      loadPuzzle(randomIndex, currentRackSize);
      setStreak(0);
    } else {
      const bank = getPuzzleBank(currentRackSize);
      const randomIndex = Math.floor(Math.random() * bank.length);
      loadPuzzle(randomIndex, currentRackSize);
    }
  };
  
  const handleContinueStreak = () => {
    if (!currentLevel) return;
    triggerHaptic('medium');
    
    setStatus('loading');
    setPossibleMoves(null);
    setWordHistory([]); // Reset visual history for the new round
    setUndoJustUsed(false); // Reset undo state for new round
    
    setTimeout(() => {
        // Generate next round based on CURRENT board word
        const currentWord = boardSlots.map(s => s.lockedChar).join('');
        const nextRoundData = generateNextRound(currentWord, currentRackSize);
        
        if (nextRoundData) {
            // Success - load new tiles, keep board same
            setRackTiles(nextRoundData.rackTiles);
            setCurrentLevel(nextRoundData); // Update level data to reflect new solution path
            
            // Re-initialize history with current word
            setWordHistory([currentWord]);
            setStreak(prev => prev + 1);
            setStatus('playing');
            setUndoJustUsed(false); // Ensure undo is reset when round starts
        } else {
            // Generator failed (dead end?)
            alert("No more valid puzzles found from this word! Streak ended.");
            setStatus('lost');
            setUndoJustUsed(false); // Reset on game over
        }
    }, 100);
  };

  const handleLoadCustomPuzzle = () => {
    triggerHaptic('light');
    const cleanWord = customStartWord.trim().toUpperCase();
    const cleanRack = customRackString.trim().toUpperCase().split('').filter(c => c.match(/[A-Z]/));

    if (cleanWord.length !== 5) {
      alert("Start word must be exactly 5 letters.");
      return;
    }

    if (!isWordValid(cleanWord)) {
      alert(`"${cleanWord}" is not in the game dictionary.`);
      return;
    }

    if (cleanRack.length === 0) {
      alert("Please enter at least one letter for the rack.");
      return;
    }

    // Load custom level
    setStatus('loading');
    setWordHistory([]);
    setPossibleMoves(null);
    setUndoJustUsed(false); // Reset undo state

    setTimeout(() => {
        // Construct a partial LevelData object
        const level: LevelData = {
            startWord: cleanWord,
            endWord: "????", 
            rackTiles: cleanRack.map(c => ({ id: Math.random().toString(36).substr(2, 9), char: c })),
            solution: [] // No solution available for custom puzzles
        };

        setCurrentLevel(level);
        setCustomLevelData(level); // Save for persistence
        setCurrentPuzzleIndex(-1); // Indicator for custom level
        setCurrentRackSize(cleanRack.length); 

        const slots: BoardSlot[] = cleanWord.split('').map((char, index) => ({
          index,
          lockedChar: char,
          stagedTile: null
        }));

        setBoardSlots(slots);
        setRackTiles(level.rackTiles);
        setWordHistory([cleanWord]);
        setStatus('playing');
        setUndoJustUsed(false); // Ensure undo is reset when custom puzzle starts
        setIsMenuOpen(false);
    }, 100);
  };

  // Calculate possible moves whenever the board/rack state settles (effectively turn start + during turn)
  useEffect(() => {
    if (status !== 'playing') {
      // Don't clear possibleMoves if we just won a round, so we can see the recap/board state nicely
      if (status !== 'won' && status !== 'round_won') {
         setPossibleMoves(null);
      }
      return;
    }

    const allAvailableTiles = [...rackTiles];
    boardSlots.forEach(slot => {
      if (slot.stagedTile) {
        allAvailableTiles.push(slot.stagedTile);
      }
    });

    const currentWord = boardSlots.map(s => s.lockedChar).join('');
    const moves = calculatePossibleMoves(currentWord, allAvailableTiles);
    setPossibleMoves(moves);

  }, [boardSlots, rackTiles, status]);

  // Check for Game Over (Lost)
  useEffect(() => {
    // Only trigger loss if possibleMoves has explicitly been calculated (is not null) and is empty
    if (status === 'playing' && possibleMoves !== null && rackTiles.length > 0) {
       const totalMoves = Object.values(possibleMoves).reduce((acc, curr: string[]) => acc + curr.length, 0);
       if (totalMoves === 0) {
         setStatus('lost');
         setUndoJustUsed(false); // Reset undo state on game over
       }
    }
  }, [possibleMoves, status, rackTiles.length]);
  
  // Reset undo state when game status changes to non-playing states
  useEffect(() => {
    if (status === 'won' || status === 'lost' || status === 'round_won' || status === 'start_screen') {
      setUndoJustUsed(false);
    }
  }, [status]);


  // Input Handlers
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent, tile: TileData, source: 'rack' | 'board', index: number) => {
    triggerHaptic('heavy');
    let clientX, clientY, touchId;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      touchId = e.touches[0].identifier;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    setDragState({
      isDragging: true,
      tile,
      source: { type: source, index },
      x: clientX,
      y: clientY,
      touchId
    });
  };

  const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!dragState.isDragging) return;

    let clientX, clientY;
    if ('touches' in e) {
      const touch = Array.from((e as TouchEvent).touches).find(t => t.identifier === dragState.touchId);
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    setDragState(prev => ({
      ...prev,
      x: clientX,
      y: clientY
    }));
  }, [dragState.isDragging, dragState.touchId]);

  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging || !dragState.tile || !dragState.source) return;

    const x = dragState.x;
    const y = dragState.y;

    const elements = document.elementsFromPoint(x, y);
    const slotElement = elements.find(el => el.getAttribute('data-slot-index'));
    const rackElement = elements.find(el => el.getAttribute('data-rack-area'));

    let handled = false;

    if (slotElement) {
      const slotIndex = parseInt(slotElement.getAttribute('data-slot-index') || '-1');
      if (slotIndex >= 0) {
        const targetSlot = boardSlots[slotIndex];
        const currentVisibleChar = targetSlot.stagedTile ? targetSlot.stagedTile.char : targetSlot.lockedChar;
        
        if (currentVisibleChar !== dragState.tile.char) {
          const newSlots = [...boardSlots];
          
          let returnedTile: TileData | null = null;
          if (newSlots[slotIndex].stagedTile) {
            returnedTile = newSlots[slotIndex].stagedTile!;
          }

          newSlots[slotIndex].stagedTile = dragState.tile;
          setBoardSlots(newSlots);

          if (dragState.source.type === 'rack') {
             const newRack = [...rackTiles];
             newRack.splice(dragState.source.index, 1);
             if (returnedTile) newRack.push(returnedTile);
             setRackTiles(newRack);
          } else {
            if (dragState.source.index !== slotIndex) {
              const prevSlotIndex = dragState.source.index;
              newSlots[prevSlotIndex].stagedTile = null; 
              if (returnedTile) {
                 setRackTiles(prev => [...prev, returnedTile!]);
              }
              setBoardSlots(newSlots);
            }
          }
          handled = true;
        }
      }
    } else if (rackElement) {
      if (dragState.source.type === 'board') {
        const newSlots = [...boardSlots];
        newSlots[dragState.source.index].stagedTile = null;
        setBoardSlots(newSlots);
        setRackTiles(prev => [...prev, dragState.tile!]);
        handled = true;
      }
    }

    if (!handled && dragState.source.type === 'board') {
       const newSlots = [...boardSlots];
       newSlots[dragState.source.index].stagedTile = null;
       setBoardSlots(newSlots);
       setRackTiles(prev => [...prev, dragState.tile!]);
    }

    setDragState({
      isDragging: false,
      tile: null,
      source: null,
      x: 0,
      y: 0
    });

    if (handled) {
      triggerHaptic('success');
    } else {
      triggerHaptic('error');
    }
  }, [dragState, boardSlots, rackTiles, triggerHaptic]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // Game Logic
  const handleSubmit = () => {
    const candidateWord = boardSlots.map(s => s.stagedTile ? s.stagedTile.char : s.lockedChar).join('').toLowerCase();
    
    if (isWordValid(candidateWord)) {
      const newSlots = boardSlots.map(s => ({
        ...s,
        lockedChar: s.stagedTile ? s.stagedTile.char : s.lockedChar,
        stagedTile: null
      }));
      setBoardSlots(newSlots);
      
      // Update history
      setWordHistory(prev => [...prev, candidateWord.toUpperCase()]);
      
      // Reset undo state after successful submit
      setUndoJustUsed(false);
      
      triggerHaptic('success');
      if (rackTiles.length === 0) {
        if (isEndlessMode) {
            setStatus('round_won');
        } else {
            setStatus('won');
        }
        // Reset undo state on game end
        setUndoJustUsed(false);
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      
      const tilesToReturn: TileData[] = [];
      const newSlots = boardSlots.map(s => {
        if (s.stagedTile) {
          tilesToReturn.push(s.stagedTile);
          return { ...s, stagedTile: null };
        }
        return s;
      });
      setBoardSlots(newSlots);
      setRackTiles(prev => [...prev, ...tilesToReturn]);
      
      // Reset undo state after invalid submit (tiles returned to rack)
      setUndoJustUsed(false);
      
      triggerHaptic('error');
    }
  };

  const handleShuffle = () => {
    triggerHaptic('light');
    setRackTiles(prev => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
  };

  const handleUndo = () => {
    // Only allow undo if there are staged tiles and undo wasn't just used
    const hasStagedTiles = boardSlots.some(s => s.stagedTile);
    if (!hasStagedTiles || undoJustUsed) {
      return;
    }
    
    triggerHaptic('light');
    const tilesToReturn: TileData[] = [];
    const newSlots = boardSlots.map(s => {
      if (s.stagedTile) {
        tilesToReturn.push(s.stagedTile);
        return { ...s, stagedTile: null };
      }
      return s;
    });
    setBoardSlots(newSlots);
    setRackTiles(prev => [...prev, ...tilesToReturn]);
    
    // Mark undo as just used - button will be disabled until tiles are staged again
    setUndoJustUsed(true);
  };
  
  // Re-enable undo button when tiles are staged again
  useEffect(() => {
    if (undoJustUsed && boardSlots.some(s => s.stagedTile)) {
      setUndoJustUsed(false);
    }
  }, [boardSlots, undoJustUsed]);

  const renderTile = (tile: TileData, isDragProxy = false) => (
    <div 
      className={`
        w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 
        bg-${COLORS.primary} 
        rounded-lg shadow-md border-b-4 border-${COLORS.primaryDark}
        flex items-center justify-center text-2xl font-bold text-white select-none
        ${isDragProxy ? 'opacity-90 scale-110 z-50 fixed pointer-events-none' : 'cursor-grab active:cursor-grabbing'}
      `}
      style={isDragProxy ? { 
        left: dragState.x, 
        top: dragState.y, 
        transform: 'translate(-50%, -50%)' 
      } : {}}
    >
      {tile.char}
    </div>
  );

  // --- RENDER HELPERS ---
  
  const getEndGameMessage = () => {
    const remaining = rackTiles.length;
    if (remaining === 0) return "Perfect!";
    if (remaining === 1) return "Amazing!";
    if (remaining === 2) return "Great Job!";
    if (remaining === 3) return "Good Effort!";
    return "Nice Try!";
  };

  // Start Screen
  if (status === 'start_screen') {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-bold text-slate-800 mb-8 tracking-tight">Word Patch</h1>
        <div className="w-full max-w-xs space-y-4">
            <button
            onClick={() => {
              triggerHaptic('light');
              handleStartGame();
            }}
            className="w-full py-4 bg-amber-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:bg-amber-600 transition-transform active:scale-95"
            >
            Start Game
            </button>
            <button 
                onClick={() => {
                  triggerHaptic('light');
                  setIsMenuOpen(true);
                }}
                className="w-full py-3 bg-white text-slate-500 font-bold rounded-xl border-2 border-slate-200"
            >
                Debug Menu
            </button>
        </div>

        {/* Start Screen Menu Overlay */}
        {isMenuOpen && (
           <div className="fixed inset-0 bg-black/50 z-50 flex justify-start">
             <div className="w-80 bg-white h-full p-6 shadow-2xl overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">Debug Settings</h2>
                <button onClick={() => {
                  triggerHaptic('light');
                  setIsMenuOpen(false);
                }}>✕</button>
               </div>

               <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                   <h3 className="font-bold text-purple-700 mb-2 flex items-center justify-between">
                       Endless Mode
                       <input 
                           type="checkbox" 
                           checked={isEndlessMode} 
                          onChange={(e) => {
                            triggerHaptic('light');
                            setIsEndlessMode(e.target.checked);
                          }}
                           className="w-5 h-5 accent-purple-600"
                        />
                   </h3>
                   <p className="text-xs text-purple-600">
                       Clear the rack to earn 5 new letters and keep playing.
                   </p>
               </div>

              <div className="mb-4 p-4 bg-slate-100 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2 flex items-center justify-between">
                  Haptics
                  <input
                    type="checkbox"
                    checked={hapticsEnabled}
                    onChange={(e) => {
                      setHapticsEnabled(e.target.checked);
                      triggerHaptic('light');
                    }}
                    className="w-5 h-5 accent-amber-500"
                  />
                </h3>
                <p className="text-xs text-slate-500">
                  Light taps for buttons; heavier feedback when moving tiles.
                </p>
                {hapticsError && (
                  <p className="text-xs text-red-600 mt-2 break-words">
                    Haptics error: {hapticsError}
                  </p>
                )}
                <button
                  onClick={() => triggerHaptic('heavy')}
                  className="mt-3 w-full bg-slate-800 text-white font-bold py-2 rounded"
                >
                  Test haptic (heavy)
                </button>
              </div>

               <div className="mb-4">
                   <h3 className="font-bold text-slate-700 mb-2">Rack Size</h3>
                   <div className="flex gap-2">
                   <button onClick={() => handleRackSizeChange(5)} className={`flex-1 py-2 rounded border ${currentRackSize === 5 ? 'bg-amber-500 text-white' : 'bg-white'}`}>5</button>
                   <button onClick={() => handleRackSizeChange(7)} className={`flex-1 py-2 rounded border ${currentRackSize === 7 ? 'bg-amber-500 text-white' : 'bg-white'}`}>7</button>
                   </div>
               </div>
               
               <div className="bg-slate-100 p-4 rounded-xl mb-4">
                <h3 className="font-bold mb-2 text-slate-700">Create Custom Puzzle</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">START WORD (5 Letters)</label>
                    <input 
                      type="text" 
                      value={customStartWord}
                      onChange={(e) => setCustomStartWord(e.target.value.toUpperCase())}
                      className="border rounded px-2 py-2 w-full font-mono uppercase"
                      placeholder="e.g. SLATE"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">RACK TILES</label>
                    <input 
                      type="text" 
                      value={customRackString}
                      onChange={(e) => setCustomRackString(e.target.value.toUpperCase())}
                      className="border rounded px-2 py-2 w-full font-mono uppercase"
                      placeholder="e.g. ABCDE"
                    />
                  </div>
                  <button 
                    onClick={handleLoadCustomPuzzle}
                    className="w-full bg-blue-500 text-white font-bold py-2 rounded hover:bg-blue-600"
                  >
                    Load Custom
                  </button>
                </div>
              </div>

               {/* Build Info at Bottom */}
               <div className="mt-6 pt-4 border-t border-slate-200">
                 <div className="text-xs text-slate-400 space-y-1">
                   {appInfo ? (
                     <>
                       <div>Version: {appInfo.version}</div>
                       <div>Build: {appInfo.build}</div>
                     </>
                   ) : appInfoError ? (
                     <div>App info error: {appInfoError}</div>
                   ) : (
                     <div>Loading build info...</div>
                   )}
                 </div>
               </div>

               <p className="text-sm text-slate-500 mt-4">Close menu to return to start screen.</p>
             </div>
             <div className="flex-1" onClick={() => setIsMenuOpen(false)}></div>
           </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-between py-8 px-4 no-touch-action select-none"
    >
      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 ease-out">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Debug Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                   <h3 className="font-bold text-purple-700 mb-2 flex items-center justify-between">
                       Endless Mode
                       <input 
                           type="checkbox" 
                           checked={isEndlessMode} 
                           onChange={(e) => {
                             triggerHaptic('light');
                             setIsEndlessMode(e.target.checked);
                           }}
                           className="w-5 h-5 accent-purple-600"
                        />
                   </h3>
                   <p className="text-xs text-purple-600">
                       Streak: {streak}
                   </p>
               </div>

              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2 flex items-center justify-between">
                  Haptics
                  <input
                    type="checkbox"
                    checked={hapticsEnabled}
                    onChange={(e) => {
                      setHapticsEnabled(e.target.checked);
                      triggerHaptic('light');
                    }}
                    className="w-5 h-5 accent-amber-500"
                  />
                </h3>
                <p className="text-xs text-slate-500">
                  Light taps for buttons; heavier feedback when moving tiles.
                </p>
              </div>

              <div className="bg-slate-100 p-4 rounded-xl">
                 <h3 className="font-bold mb-2 text-slate-700">Rack Size</h3>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => handleRackSizeChange(5)}
                      className={`flex-1 py-2 rounded font-bold border transition-colors ${currentRackSize === 5 ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      5 Tiles
                    </button>
                    <button 
                      onClick={() => handleRackSizeChange(7)}
                      className={`flex-1 py-2 rounded font-bold border transition-colors ${currentRackSize === 7 ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      7 Tiles
                    </button>
                 </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-xl">
                <h3 className="font-bold mb-2 text-slate-700">Create Custom Puzzle</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">START WORD (5 Letters)</label>
                    <input 
                      type="text" 
                      value={customStartWord}
                      onChange={(e) => setCustomStartWord(e.target.value.toUpperCase())}
                      className="border rounded px-2 py-2 w-full font-mono uppercase"
                      placeholder="e.g. SLATE"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">RACK TILES</label>
                    <input 
                      type="text" 
                      value={customRackString}
                      onChange={(e) => setCustomRackString(e.target.value.toUpperCase())}
                      className="border rounded px-2 py-2 w-full font-mono uppercase"
                      placeholder="e.g. ABCDE"
                    />
                  </div>
                  <button 
                    onClick={handleLoadCustomPuzzle}
                    className="w-full bg-blue-500 text-white font-bold py-2 rounded hover:bg-blue-600"
                  >
                    Load Custom
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-xl">
                <h3 className="font-bold mb-2 text-slate-700">Select Puzzle</h3>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 30 }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                          triggerHaptic('light');
                          loadPuzzle(idx, currentRackSize);
                          setIsMenuOpen(false);
                      }}
                      className={`
                        py-2 rounded text-sm font-bold transition-colors
                        ${currentPuzzleIndex === idx && !isEndlessMode
                          ? 'bg-amber-500 text-white shadow-md' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}
                      `}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-xl">
                <h3 className="font-bold mb-2 text-slate-700">
                    Possible Moves ({possibleMoves ? Object.values(possibleMoves).reduce((a, b: string[]) => a + b.length, 0) : 0})
                </h3>
                <div className="text-xs font-mono text-slate-600 h-32 overflow-y-auto bg-white p-2 rounded border border-slate-200">
                  {possibleMoves !== null 
                    ? (
                        Object.values(possibleMoves).some((l: string[]) => l.length > 0) ? (
                            <div>
                                {[5, 4, 3, 2, 1].map(count => {
                                    const words = possibleMoves[count];
                                    if (!words || words.length === 0) return null;
                                    return (
                                        <div key={count} className="mb-2">
                                            <div className="font-bold text-slate-400 border-b border-slate-100 mb-1">{count} Tiles</div>
                                            <div className="leading-relaxed">{words.join(', ')}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <span className="text-slate-400 italic">No valid moves found</span>
                    )
                    : <span className="text-slate-400 italic">Calculating...</span>
                  }
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2 text-slate-700">Solution for Round</h3>
                
                {currentLevel ? (
                  currentLevel.solution.length > 0 ? (
                    <div className="space-y-4">
                        <div className="p-2 bg-amber-50 rounded border border-amber-200">
                        <span className="text-xs font-bold text-slate-400 block">START</span>
                        <span className="font-mono text-lg font-bold">{currentLevel.startWord}</span>
                        </div>

                        {currentLevel.solution.map((step, idx) => (
                        <div key={idx} className="relative pl-4 border-l-2 border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">
                            Step {idx + 1}: Use <span className="font-bold text-amber-600">{step.tilesUsed.join(', ')}</span>
                            </div>
                            <div className="p-2 bg-white rounded border border-slate-200 shadow-sm">
                            <span className="font-mono text-lg font-bold">{step.targetWord.toUpperCase()}</span>
                            </div>
                        </div>
                        ))}
                    </div>
                  ) : <div className="text-sm text-slate-500 italic">No pre-calculated solution.</div>
                ) : null}
              </div>

              {/* Build Info at Bottom */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-400 space-y-1">
                  {appInfo ? (
                    <>
                      <div>Version: {appInfo.version}</div>
                      <div>Build: {appInfo.build}</div>
                    </>
                  ) : appInfoError ? (
                    <div>App info error: {appInfoError}</div>
                  ) : (
                    <div>Loading build info...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Header / HUD */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 relative z-10">
        <button 
          onClick={() => {
            triggerHaptic('light');
            setIsMenuOpen(true);
          }}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Word Patch</h1>
            {isEndlessMode && <div className="text-xs font-bold text-purple-600 uppercase tracking-widest">Streak: {streak}</div>}
        </div>
        
        <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {rackTiles.length} tiles left
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md gap-12">
        
        {/* End Game Modal (Non-blocking) */}
        {(status === 'won' || status === 'lost' || status === 'round_won') && (
           <div className="absolute top-20 left-0 right-0 flex justify-center z-30 pointer-events-auto">
             <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-6 w-11/12 max-w-xs border-2 border-amber-100 animate-pop flex flex-col items-center text-center">
                <div className="text-4xl mb-2">{(status === 'won' || status === 'round_won') ? '🎉' : '🤔'}</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{getEndGameMessage()}</h2>
                
                {status === 'lost' && <p className="text-sm text-slate-500 mb-4">No more valid moves available.</p>}
                
                {(status === 'won' || status === 'round_won') && (
                  <div className="w-full mb-4">
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b pb-1">Puzzle Recap</div>
                     <div className="space-y-1 max-h-40 overflow-y-auto text-sm font-mono font-medium text-slate-600">
                        {wordHistory.map((word, i) => (
                            <div key={i} className={`flex justify-between px-4 ${i === wordHistory.length - 1 ? 'text-amber-600 font-bold' : ''}`}>
                                <span>{i === 0 ? 'START' : i}</span>
                                <span>{word}</span>
                            </div>
                        ))}
                     </div>
                  </div>
                )}

                <div className="flex gap-2 w-full mt-2">
                    {!isEndlessMode && (
                        <button 
                            onClick={() => {
                                triggerHaptic('light');
                                loadPuzzle(currentPuzzleIndex, currentRackSize);
                            }}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                        >
                            Replay
                        </button>
                    )}
                    
                    {isEndlessMode && status === 'round_won' ? (
                        <button 
                            onClick={() => {
                                triggerHaptic('light');
                                handleContinueStreak();
                            }}
                            className="flex-[2] py-3 bg-purple-500 text-white rounded-xl font-bold shadow-md hover:bg-purple-600"
                        >
                            Continue Streak
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                triggerHaptic('light');
                                if (isEndlessMode) {
                                    handleStartGame(); // Restart endless run
                                } else {
                                    loadPuzzle((currentPuzzleIndex + 1) % 30, currentRackSize);
                                }
                            }}
                            className={`flex-[2] py-3 text-white rounded-xl font-bold shadow-md ${isEndlessMode && status === 'lost' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                        >
                            {isEndlessMode && status === 'lost' ? 'Try Again' : 'Next Puzzle'}
                        </button>
                    )}
                </div>
             </div>
           </div>
        )}

        {/* Word Board */}
        <div className={`flex gap-2 sm:gap-3 ${shake ? 'animate-shake' : ''}`}>
          {boardSlots.map((slot) => (
            <div 
              key={slot.index}
              data-slot-index={slot.index}
              className={`
                w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20
                rounded-xl border-2 transition-colors duration-200
                flex items-center justify-center relative
                ${slot.stagedTile ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-white'}
              `}
            >
              <span className={`text-3xl font-bold text-slate-300 ${slot.stagedTile ? 'opacity-0' : 'opacity-100'}`}>
                {slot.lockedChar}
              </span>

              {slot.stagedTile && (
                <div 
                  className="absolute inset-0 p-1 animate-pop"
                  onMouseDown={(e) => handleDragStart(e, slot.stagedTile!, 'board', slot.index)}
                  onTouchStart={(e) => handleDragStart(e, slot.stagedTile!, 'board', slot.index)}
                >
                  <div className={`
                    w-full h-full bg-${COLORS.primary} 
                    rounded-lg shadow-sm border-b-4 border-${COLORS.primaryDark}
                    flex items-center justify-center text-2xl font-bold text-white cursor-grab
                    ${dragState.isDragging && dragState.source?.type === 'board' && dragState.source.index === slot.index ? 'opacity-0' : 'opacity-100'}
                  `}>
                    {slot.stagedTile.char}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rack */}
        <div 
          className="w-full bg-slate-200 rounded-2xl p-4 min-h-[5rem] flex items-center justify-center"
          data-rack-area="true"
        >
          <div className="flex flex-wrap justify-center gap-2">
            {rackTiles.map((tile, i) => (
              <div 
                key={tile.id}
                onMouseDown={(e) => handleDragStart(e, tile, 'rack', i)}
                onTouchStart={(e) => handleDragStart(e, tile, 'rack', i)}
                className={`transition-all duration-200 ${dragState.isDragging && dragState.source?.type === 'rack' && dragState.source.index === i ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}
              >
                {renderTile(tile)}
              </div>
            ))}
            {rackTiles.length === 0 && status === 'playing' && (
              <span className="text-slate-400 italic font-medium">Rack empty! Submit to win.</span>
            )}
          </div>
        </div>

      </div>

      {/* Controls */}
      <div className="w-full max-w-md flex gap-4 mt-auto pt-8">
        <button 
          onClick={handleUndo}
          disabled={!boardSlots.some(s => s.stagedTile) || undoJustUsed}
          className="flex-1 py-4 rounded-xl bg-slate-200 text-slate-600 font-bold uppercase tracking-wider disabled:opacity-50 active:bg-slate-300 transition-colors"
        >
          Undo
        </button>
        <button 
          onClick={handleShuffle}
          disabled={rackTiles.length < 2}
          className="flex-1 py-4 rounded-xl bg-slate-200 text-slate-600 font-bold uppercase tracking-wider disabled:opacity-50 active:bg-slate-300 transition-colors"
        >
          Shuffle
        </button>
        <button 
          onClick={handleSubmit}
          disabled={!boardSlots.some(s => s.stagedTile)}
          className={`
            flex-[2] py-4 rounded-xl text-white font-bold uppercase tracking-wider shadow-lg transition-all
            ${boardSlots.some(s => s.stagedTile) ? 'bg-green-500 active:bg-green-600 transform active:scale-95' : 'bg-slate-300 cursor-not-allowed'}
          `}
        >
          Submit
        </button>
      </div>

      {dragState.isDragging && dragState.tile && renderTile(dragState.tile, true)}

      {status === 'loading' && (
        <div className="absolute inset-0 bg-slate-50 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading Puzzle #{currentPuzzleIndex === -1 ? 'Custom' : currentPuzzleIndex + 1}...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
