
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { isWordValid, calculatePossibleMoves, generateNextRound } from './gameLogic';
import { getPuzzleBank, getPuzzleByIndex } from './assets';
import { TileData, BoardSlot, DragState, GameStatus, LevelData } from './types';
import { WORD_LENGTH } from './constants';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { audioManager } from './audio/AudioManager';
import { playerDataManager } from './data/PlayerDataManager';
import { firebaseSyncManager } from './data/FirebaseSyncManager';
import { puzzleDataManager } from './data/PuzzleDataManager';
import { remotePuzzleLoader } from './data/RemotePuzzleLoader';
import { refreshPremadePuzzles } from './assets';
import puzzlesJSON from './puzzles.json';
import { authManager, UserProfile } from './data/AuthManager';
import { ProfileButton } from './components/ProfileButton';
import { SignInModal } from './components/SignInModal';
import { handleEmailLink } from './utils/emailLinkHandler';
import { ProSubscriptionPanel } from './components/ProSubscriptionPanel';
import { performAppleSignIn } from './utils/appleSignIn';
import { useRevenueCat } from './revenuecat/RevenueCatProvider';
// Import background via Vite/webpack asset pipeline.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - bundler will handle the image file.
import bgImage from '../../resources/images/bg_1.png';

const App: React.FC = () => {
  const { setAppUserId } = useRevenueCat();
  const [status, setStatus] = useState<GameStatus>('start_screen');
  const [currentLevel, setCurrentLevel] = useState<LevelData | null>(null);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(0);
  const [currentRackSize] = useState<number>(5);
  const [boardSlots, setBoardSlots] = useState<BoardSlot[]>([]);
  const [rackTiles, setRackTiles] = useState<TileData[]>([]);
  const [shake, setShake] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
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
  
  // Audio settings state
  const [musicVolume, setMusicVolume] = useState(() => audioManager.getMusicVolume());
  const [sfxVolume, setSfxVolume] = useState(() => audioManager.getSfxVolume());
  const lastSfxPreviewAtRef = useRef<number>(0);
  const previewSfxAtCurrentVolume = useCallback(() => {
    // Prevent duplicate triggers on some devices (touchend + mouseup)
    const now = Date.now();
    if (now - lastSfxPreviewAtRef.current < 250) return;
    lastSfxPreviewAtRef.current = now;

    // Small delay to ensure the gain node has updated first
    setTimeout(() => {
      audioManager.playSfx('UI_click');
    }, 10);
  }, []);
  
  // Track play time
  const playTimeRef = useRef<number>(0);
  const playTimeIntervalRef = useRef<number | null>(null);
  
  // Puzzle version state for debug panel
  const [puzzleVersion, setPuzzleVersion] = useState(() => {
    try {
      return puzzleDataManager.getVersion();
    } catch {
      return {
        version: 'unknown',
        timestamp: new Date().toISOString(),
        source: 'local' as const,
        puzzleCount: 0,
        rackSizes: [],
      };
    }
  });
  
  // Auth state for debug panel
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  // Authentication state
  const [authUser, setAuthUser] = useState<UserProfile | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleError, setAppleError] = useState<string | null>(null);
  
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

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = authManager.onAuthStateChanged((user) => {
      setAuthUser(user);
      if (user) {
        setAuthUserId(user.uid);
      }
      // Sync app user to RevenueCat for purchase/entitlement portability across devices.
      // Keep RevenueCat anonymous users for anonymous sessions.
      void setAppUserId(user && !user.isAnonymous ? user.uid : null);
    });
    return unsubscribe;
  }, [setAppUserId]);

  // Initialize puzzle data, player data, and Firebase sync on app mount
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        // 1. Initialize puzzle data FIRST (non-blocking, loads from cache or bundled)
        console.log('[App] Initializing puzzle data...');
        await puzzleDataManager.initialize();
        if (isMounted) {
          setPuzzleVersion(puzzleDataManager.getVersion());
        }
        console.log('[App] Puzzle data initialized:', puzzleDataManager.getVersion().source);

        // 2. Check if opened via email link
        const currentUrl = window.location.href;
        if (currentUrl.includes('/__/auth/action')) {
          console.log('[App] Detected email link in URL');
          const linkHandled = await handleEmailLink(currentUrl);
          if (linkHandled) {
            console.log('[App] Email link authentication completed');
            // Clear URL without reload
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }

        // 3. Initialize auth (anonymous or existing)
        console.log('[App] Initializing authentication...');
        const user = await authManager.initialize();
        if (!user) {
          console.error('[App] Failed to initialize authentication');
          return;
        }

        console.log('[App] Authenticated as:', user.isAnonymous ? 'Anonymous' : user.email);

        // 4. Initialize player data with user ID
        await playerDataManager.initialize(user.uid);
        
        // 5. Perform initial sync if not anonymous
        if (!user.isAnonymous) {
          await firebaseSyncManager.performInitialSync();
          if (isMounted) {
            setLastSyncTime(new Date().toLocaleTimeString());
          }
          firebaseSyncManager.startPeriodicSync();
        }

        // Start activity session
        playerDataManager.startSession();

        // 6. Game is ready - all critical data loaded
        console.log('[App] Game ready!');

        // 7. Background: Check for puzzle updates (non-blocking)
        console.log('[App] Checking for puzzle updates in background...');
        remotePuzzleLoader.checkForUpdates(false).then(() => {
          console.log('[App] Puzzle update check complete');
          if (isMounted) {
            const newVersion = puzzleDataManager.getVersion();
            setPuzzleVersion(newVersion);
            if (puzzleDataManager.hasPendingUpdate()) {
              console.log('[App] Puzzle update is pending (will apply on next puzzle load)');
            }
          }
        }).catch((error) => {
          console.warn('[App] Puzzle update check failed:', error);
        });

      } catch (error) {
        console.error('Failed to initialize app data:', error);
      }
    };

    if (isMounted) {
      initializeData();
    }

    return () => {
      isMounted = false;
      // End session and sync on unmount
      playerDataManager.endSession().catch(console.error);
      firebaseSyncManager.stopPeriodicSync();
      firebaseSyncManager.forceSync().catch(console.error);
    };
  }, []);

  // Handle app state changes (background/foreground) for music and sync
  useEffect(() => {
    let listenerHandle: any = null;
    
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App came to foreground - resume music and sync
        audioManager.resumeMusic();
        firebaseSyncManager.forceSync().catch(console.error);
      } else {
        // App went to background - pause music and end session
        audioManager.pauseMusic();
        playerDataManager.endSession().catch(console.error);
        firebaseSyncManager.forceSync().catch(console.error);
      }
    }).then(handle => {
      listenerHandle = handle;
    });

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  // Load haptics setting from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('settings.hapticsEnabled');
      if (saved !== null) {
        setHapticsEnabled(saved === 'true');
      }
    } catch (e) {
      console.warn('Failed to load haptics setting:', e);
    }
  }, []);

  // Save haptics setting when it changes
  useEffect(() => {
    try {
      localStorage.setItem('settings.hapticsEnabled', hapticsEnabled.toString());
    } catch (e) {
      console.warn('Failed to save haptics setting:', e);
    }
  }, [hapticsEnabled]);

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
    
    // Apply any pending puzzle update when loading new puzzle
    if (puzzleDataManager.hasPendingUpdate()) {
      puzzleDataManager.applyPendingUpdate().then((applied) => {
        if (applied) {
          console.log('[App] Applied pending puzzle update');
          setPuzzleVersion(puzzleDataManager.getVersion());
          refreshPremadePuzzles();
        }
      }).catch(console.error);
    }
    
    // Track puzzle start
    if (index >= 0) {
      playerDataManager.onPuzzleStart(rackSize, index).catch(console.error);
    }
    
    // Start new music track for this puzzle
    audioManager.onNewPuzzle();
    
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
        
        // Start tracking play time
        if (playTimeIntervalRef.current) {
          clearInterval(playTimeIntervalRef.current);
        }
        playTimeRef.current = Date.now();
        playTimeIntervalRef.current = window.setInterval(() => {
          const elapsed = Math.floor((Date.now() - playTimeRef.current) / 1000);
          if (elapsed > 0) {
            playerDataManager.addPlayTime(1).catch(console.error);
            playTimeRef.current = Date.now();
          }
        }, 10000); // Update every 10 seconds
      }
    }, 100);
  }, [customLevelData]);
  
  // Stop play time tracking when game ends
  useEffect(() => {
    if (status === 'won' || status === 'lost' || status === 'round_won' || status === 'start_screen') {
      if (playTimeIntervalRef.current) {
        clearInterval(playTimeIntervalRef.current);
        playTimeIntervalRef.current = null;
      }
    }
    return () => {
      if (playTimeIntervalRef.current) {
        clearInterval(playTimeIntervalRef.current);
      }
    };
  }, [status]);

  useEffect(() => {
    // Ensure bank is generated for the current (fixed) size
    getPuzzleBank(currentRackSize);
  }, [currentRackSize]);

  const handleStartGame = () => {
    triggerHaptic('light');
    // Initialize AudioContext on first user interaction (required for iOS)
    audioManager.initializeOnUserInteraction();
    audioManager.playSfx('UI_click');
    
    // Start activity session if not already started
    playerDataManager.startSession();
    
    if (isEndlessMode) {
      // Endless mode starts with a random puzzle, then continues
      const bank = getPuzzleBank(currentRackSize);
      const randomIndex = Math.floor(Math.random() * bank.length);
      loadPuzzle(randomIndex, currentRackSize);
      setStreak(0);
      // Reset streak in player data
      playerDataManager.updateStreak(0).catch(console.error);
    } else {
      const bank = getPuzzleBank(currentRackSize);
      const randomIndex = Math.floor(Math.random() * bank.length);
      loadPuzzle(randomIndex, currentRackSize);
    }
  };
  
  const handleContinueStreak = () => {
    if (!currentLevel) return;
    triggerHaptic('medium');
    audioManager.playSfx('UI_click');
    
    setStatus('loading');
    setPossibleMoves(null);
    setWordHistory([]); // Reset visual history for the new round
    setUndoJustUsed(false); // Reset undo state for new round
    
    // Start new music track for new round
    audioManager.onNewPuzzle();
    
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
            const newStreak = streak + 1;
            setStreak(newStreak);
            // Track streak update
            playerDataManager.updateStreak(newStreak).catch(console.error);
            // Track endless round completion
            playerDataManager.onEndlessRoundComplete().catch(console.error);
            setStatus('playing');
            setUndoJustUsed(false); // Ensure undo is reset when round starts
            // Queue sync
            firebaseSyncManager.queueSync();
        } else {
            // Generator failed (dead end?)
            alert("No more valid puzzles found from this word! Streak ended.");
            setStatus('lost');
            setUndoJustUsed(false); // Reset on game over
            audioManager.playSfx('puzzle_win_okay');
            // Track loss (endless mode)
            playerDataManager.onPuzzleLost(currentRackSize, -1).catch(console.error);
            firebaseSyncManager.queueSync();
        }
    }, 100);
  };

  const handleAppleSignInFromStart = async () => {
    setAppleError(null);
    setAppleLoading(true);

    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Apple Sign In is only available on a device build.');
      }

      const res = await performAppleSignIn();
      console.log('[StartScreen] Apple sign in response:', res);

      // Extract identityToken + raw nonce for Firebase
      // @capacitor-community/apple-sign-in returns `response.identityToken` (JWT).
      if (!res.response?.identityToken) {
        throw new Error('Apple Sign In did not return an identityToken');
      }

      const idToken = res.response.identityToken;
      const nonce = res.nonce;

      // Sign in or link with Firebase
      await authManager.signInWithApple(idToken, nonce);
      console.log('[StartScreen] Apple authentication successful');
    } catch (error: any) {
      console.error('[StartScreen] Apple sign in error:', error);
      const msg = error?.message || 'Apple Sign In failed';
      // Treat user cancel as non-error.
      if (!/cancel/i.test(msg) && !/AuthorizationError error 1000/i.test(msg)) {
        setAppleError(msg);
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const handleLoadCustomPuzzle = () => {
    triggerHaptic('light');
    audioManager.playSfx('UI_click');
    const cleanWord = customStartWord.trim().toUpperCase();
    const cleanRack = customRackString.trim().toUpperCase().split('').filter(c => c.match(/[A-Z]/));

    if (cleanWord.length !== 5) {
      alert("Start word must be exactly 5 letters.");
      audioManager.playSfx('word_wrong');
      return;
    }

    if (!isWordValid(cleanWord)) {
      alert(`"${cleanWord}" is not in the game dictionary.`);
      audioManager.playSfx('word_wrong');
      return;
    }

    if (cleanRack.length === 0) {
      alert("Please enter at least one letter for the rack.");
      audioManager.playSfx('word_wrong');
      return;
    }

    // Load custom level
    setStatus('loading');
    setWordHistory([]);
    setPossibleMoves(null);
    setUndoJustUsed(false); // Reset undo state

    // Start new music track for custom puzzle
    audioManager.onNewPuzzle();

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
  // Use requestAnimationFrame to batch updates and avoid blocking the main thread
  useEffect(() => {
    if (status !== 'playing') {
      // Don't clear possibleMoves if we just won a round, so we can see the recap/board state nicely
      if (status !== 'won' && status !== 'round_won') {
         setPossibleMoves(null);
      }
      return;
    }

    // Defer calculation to next frame to avoid blocking UI
    const frameId = requestAnimationFrame(() => {
      const allAvailableTiles = [...rackTiles];
      boardSlots.forEach(slot => {
        if (slot.stagedTile) {
          allAvailableTiles.push(slot.stagedTile);
        }
      });

      const currentWord = boardSlots.map(s => s.lockedChar).join('');
      const moves = calculatePossibleMoves(currentWord, allAvailableTiles);
      setPossibleMoves(moves);
    });

    return () => cancelAnimationFrame(frameId);
  }, [boardSlots, rackTiles, status]);

  // Check for Game Over (Lost)
  useEffect(() => {
    // Only trigger loss if possibleMoves has explicitly been calculated (is not null) and is empty
    if (status === 'playing' && possibleMoves !== null && rackTiles.length > 0) {
       // Use requestAnimationFrame to avoid blocking
       const frameId = requestAnimationFrame(() => {
         const totalMoves = Object.values(possibleMoves).reduce((acc, curr: string[]) => acc + curr.length, 0);
         if (totalMoves === 0) {
           setStatus('lost');
           setUndoJustUsed(false); // Reset undo state on game over
           audioManager.playSfx('puzzle_win_okay');
           // Track puzzle loss
           if (currentPuzzleIndex >= 0) {
             playerDataManager.onPuzzleLost(currentRackSize, currentPuzzleIndex).catch(console.error);
           }
           // Queue sync
           firebaseSyncManager.queueSync();
         }
       });
       return () => cancelAnimationFrame(frameId);
    }
    return undefined;
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
    audioManager.playSfx('tile_pickup');
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
          // Play tile_release sound when successfully placed
          audioManager.playSfx('tile_release');
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
      audioManager.playSfx('word_valid');
      
      if (rackTiles.length === 0) {
        const startTime = currentLevel ? Date.now() - (wordHistory.length * 5000) : Date.now(); // Rough estimate
        const timeToComplete = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        
        if (isEndlessMode) {
            setStatus('round_won');
            // Track endless round completion
            playerDataManager.onEndlessRoundComplete().catch(console.error);
        } else {
            setStatus('won');
            // Track puzzle completion
            if (currentPuzzleIndex >= 0) {
              playerDataManager.onPuzzleComplete(
                currentRackSize,
                currentPuzzleIndex,
                timeToComplete,
                0 // tilesRemaining = 0 (perfect)
              ).catch(console.error);
            }
        }
        // Reset undo state on game end
        setUndoJustUsed(false);
        // Play perfect win sound when rack is cleared
        audioManager.playSfx('puzzle_win_perfect');
        
        // Queue sync after completion
        firebaseSyncManager.queueSync();
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
      audioManager.playSfx('word_wrong');
    }
  };

  const handleShuffle = () => {
    triggerHaptic('light');
    audioManager.playSfx('UI_click');
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
    audioManager.playSfx('UI_click');
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
        tile tile--rack
        w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 
        flex items-center justify-center text-2xl select-none
        ${isDragProxy ? 'opacity-90 scale-110 z-50 fixed pointer-events-none' : 'cursor-grab active:cursor-grabbing'}
      `}
      style={isDragProxy ? { 
        left: dragState.x, 
        top: dragState.y, 
        transform: 'translate(-50%, -50%)' 
      } : {}}
    >
      <span className="tile-letter tile-letter--rack">
        {tile.char}
      </span>
    </div>
  );

  // Render unified Settings Panel
  const renderSettingsPanel = () => (
    <div className="space-y-6">
      {/* Audio Section */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-4">Audio</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-base font-semibold text-slate-700">Music Volume</label>
              <span className="text-sm font-medium text-slate-600 bg-slate-200 px-2 py-1 rounded">{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                setMusicVolume(vol);
                // Update volume immediately using GainNode (works on iOS!)
                audioManager.setMusicVolume(vol);
                // Save to player data
                playerDataManager.updateSettings({ musicVolume: vol }).catch(console.error);
              }}
              onMouseUp={() => {
                audioManager.playSfx('UI_click');
              }}
              onTouchEnd={() => {
                audioManager.playSfx('UI_click');
              }}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              style={{
                background: `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${musicVolume * 100}%, rgb(226 232 240) ${musicVolume * 100}%, rgb(226 232 240) 100%)`
              }}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-base font-semibold text-slate-700">Sound Effects Volume</label>
              <span className="text-sm font-medium text-slate-600 bg-slate-200 px-2 py-1 rounded">{Math.round(sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sfxVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                setSfxVolume(vol);
                // Update volume immediately using GainNode (works on iOS!)
                audioManager.setSfxVolume(vol);
                // Save to player data
                playerDataManager.updateSettings({ sfxVolume: vol }).catch(console.error);
              }}
              onMouseUp={() => {
                previewSfxAtCurrentVolume();
              }}
              onTouchEnd={() => {
                previewSfxAtCurrentVolume();
              }}
              onKeyUp={(e) => {
                // For keyboard adjustments on focused range inputs
                if (
                  e.key === 'ArrowLeft' ||
                  e.key === 'ArrowRight' ||
                  e.key === 'ArrowUp' ||
                  e.key === 'ArrowDown' ||
                  e.key === 'Home' ||
                  e.key === 'End'
                ) {
                  previewSfxAtCurrentVolume();
                }
              }}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              style={{
                background: `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${sfxVolume * 100}%, rgb(226 232 240) ${sfxVolume * 100}%, rgb(226 232 240) 100%)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Haptics Section */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-2 flex items-center justify-between">
          Haptics
          <input
            type="checkbox"
            checked={hapticsEnabled}
            onChange={(e) => {
              setHapticsEnabled(e.target.checked);
              triggerHaptic('light');
              audioManager.playSfx('UI_toggle');
              // Save to player data
              playerDataManager.updateSettings({ hapticsEnabled: e.target.checked }).catch(console.error);
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
      </div>

      {/* Hightop Games Pro (RevenueCat) */}
      <ProSubscriptionPanel title="Hightop Games Pro" />

      {/* Links Section */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-3">Legal & Support</h3>
        <div className="space-y-2">
          <a
            href="https://hightopgames.com/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              triggerHaptic('light');
              audioManager.playSfx('UI_click');
            }}
            className="block text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Privacy Policy
          </a>
          <a
            href="https://hightopgames.com/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              triggerHaptic('light');
              audioManager.playSfx('UI_click');
            }}
            className="block text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Terms of Service
          </a>
          <a
            href="https://hightopgames.com/support.html"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              triggerHaptic('light');
              audioManager.playSfx('UI_click');
            }}
            className="block text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Support
          </a>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-2">About</h3>
        <p className="text-xs text-slate-500 mb-3">
          Daily Reword is a word puzzle game where you transform words by swapping letters. 
          Clear the rack to complete each puzzle!
        </p>
        {appInfo && (
          <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-200">
            <div>Version: {appInfo.version}</div>
            <div>Build: {appInfo.build}</div>
          </div>
        )}
        {appInfoError && (
          <div className="text-xs text-red-600 pt-2 border-t border-slate-200">
            App info error: {appInfoError}
          </div>
        )}
      </div>

      {/* Debug Section - Hidden by default, shown when showDebug is true */}
      {showDebug && (
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 mt-6">
          <h3 className="font-bold text-purple-700 mb-4">Debug Tools</h3>
          
          <div className="space-y-4">
            {/* Puzzle Data Version */}
            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-700 mb-2">Puzzle Data</h4>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Pack Version:</span>
                  <span className="font-mono">{(() => {
                    try {
                      const packData = (puzzlesJSON as any);
                      return packData.version || 'N/A';
                    } catch {
                      return 'N/A';
                    }
                  })()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Hash:</span>
                  <span className="font-mono">{puzzleVersion.version.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Source:</span>
                  <span className="capitalize">{puzzleVersion.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Count:</span>
                  <span>{puzzleVersion.puzzleCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated:</span>
                  <span>{new Date(puzzleVersion.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  triggerHaptic('light');
                  audioManager.playSfx('UI_click');
                  console.log('[Debug] Checking for puzzle updates...');
                  try {
                    await remotePuzzleLoader.checkForUpdates(status === 'playing');
                    const newVersion = puzzleDataManager.getVersion();
                    setPuzzleVersion(newVersion);
                    console.log('[Debug] Update check complete');
                  } catch (error) {
                    console.error('[Debug] Update check failed:', error);
                  }
                }}
                className="w-full mt-2 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
              >
                Check for Updates
              </button>
            </div>

            {/* Auth Status */}
            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-700 mb-2">Authentication</h4>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">User ID:</span>
                  <span className="font-mono text-xs">{authUserId ? authUserId.slice(0, 12) + '...' : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span>{authUserId ? (authUser?.isAnonymous ? '🔒 Anonymous' : '✅ Signed In') : '❌ Not signed in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{authUser?.email || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email Verified:</span>
                  <span>{authUser?.emailVerified ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Display Name:</span>
                  <span>{authUser?.displayName || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Is Anonymous:</span>
                  <span>{authUser?.isAnonymous ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Last Sync:</span>
                  <span>{lastSyncTime || 'Never'}</span>
                </div>
              </div>
            </div>

            {/* Player Data Controls */}
            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-700 mb-2">Player Data</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    audioManager.playSfx('UI_click');
                    try {
                      const playerData = playerDataManager.getPlayerData();
                      console.log('[Debug] Player Data:', JSON.stringify(playerData, null, 2));
                      alert('Player data printed to console (check Xcode logs)');
                    } catch (error) {
                      console.error('[Debug] Failed to get player data:', error);
                      alert('Failed to get player data: ' + error);
                    }
                  }}
                  className="w-full px-3 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition-colors"
                >
                  Print Player Data to Console
                </button>
                <button
                  onClick={async () => {
                    triggerHaptic('medium');
                    audioManager.playSfx('UI_click');
                    if (confirm('Clear ALL player data? This cannot be undone!')) {
                      try {
                        // Clear local storage
                        const plugin = (window as any).LocalStorage;
                        if (plugin) {
                          await plugin.savePlayerData({ data: null });
                        }
                        console.log('[Debug] Player data cleared');
                        alert('Player data cleared successfully');
                      } catch (error) {
                        console.error('[Debug] Failed to clear player data:', error);
                        alert('Failed to clear player data: ' + error);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors"
                >
                  Clear All Player Data
                </button>
                <button
                  onClick={async () => {
                    triggerHaptic('medium');
                    audioManager.playSfx('UI_click');
                    if (confirm('Clear puzzle cache? Game will reload bundled puzzles.')) {
                      try {
                        await puzzleDataManager.clearCache();
                        const newVersion = puzzleDataManager.getVersion();
                        setPuzzleVersion(newVersion);
                        refreshPremadePuzzles();
                        console.log('[Debug] Puzzle cache cleared');
                        alert('Puzzle cache cleared successfully');
                      } catch (error) {
                        console.error('[Debug] Failed to clear puzzle cache:', error);
                        alert('Failed to clear puzzle cache: ' + error);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded hover:bg-orange-600 transition-colors"
                >
                  Clear Puzzle Cache
                </button>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <h4 className="font-bold text-purple-700 mb-2 flex items-center justify-between">
                Endless Mode
                <input 
                  type="checkbox" 
                  checked={isEndlessMode} 
                  onChange={(e) => {
                    triggerHaptic('light');
                    audioManager.playSfx('UI_toggle');
                    setIsEndlessMode(e.target.checked);
                    if (!e.target.checked) {
                      // Reset streak when disabling endless mode
                      setStreak(0);
                      playerDataManager.updateStreak(0).catch(console.error);
                    }
                  }}
                  className="w-5 h-5 accent-purple-600"
                />
              </h4>
              <p className="text-xs text-purple-600">
                {isEndlessMode ? `Streak: ${streak}` : 'Clear the rack to earn 5 new letters and keep playing.'}
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <h4 className="font-bold text-purple-700 mb-2">Create Custom Puzzle</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">START WORD (5 Letters)</label>
                  <input 
                    type="text" 
                    value={customStartWord}
                    onChange={(e) => setCustomStartWord(e.target.value.toUpperCase())}
                    className="border rounded px-2 py-2 w-full font-mono uppercase text-sm"
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
                    className="border rounded px-2 py-2 w-full font-mono uppercase text-sm"
                    placeholder="e.g. ABCDE"
                  />
                </div>
                <button 
                  onClick={() => {
                    handleLoadCustomPuzzle();
                    audioManager.playSfx('UI_click');
                  }}
                  className="w-full bg-blue-500 text-white font-bold py-2 rounded hover:bg-blue-600 text-sm"
                >
                  Load Custom
                </button>
              </div>
            </div>

            {status !== 'start_screen' && (
              <>
                <div className="bg-white p-3 rounded-lg border border-purple-100">
                  <h4 className="font-bold text-purple-700 mb-2">Select Puzzle</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 30 }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          triggerHaptic('light');
                          audioManager.playSfx('UI_click');
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

                <div className="bg-white p-3 rounded-lg border border-purple-100">
                  <h4 className="font-bold text-purple-700 mb-2">
                    Possible Moves ({possibleMoves ? Object.values(possibleMoves).reduce((a, b: string[]) => a + b.length, 0) : 0})
                  </h4>
                  <div className="text-xs font-mono text-slate-600 h-32 overflow-y-auto bg-slate-50 p-2 rounded border border-slate-200">
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

                <div className="bg-white p-3 rounded-lg border border-purple-100">
                  <h4 className="font-bold text-purple-700 mb-2">Solution for Round</h4>
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
              </>
            )}
          </div>
        </div>
      )}
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
        <h1 className="text-5xl font-bold text-slate-800 mb-6 tracking-tight">Daily Reword</h1>
        <div className="w-full max-w-xs space-y-4">
          {/* Apple Sign In (plugin-based, always visible here) */}
          <button
            onClick={handleAppleSignInFromStart}
            disabled={appleLoading}
            className="w-full py-3 px-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 disabled:bg-slate-400 transition-colors flex items-center justify-center space-x-2"
          >
            {appleLoading ? (
              <span>Signing in…</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <span>Continue with Apple</span>
              </>
            )}
          </button>
          {appleError && (
            <p className="text-xs text-red-600 text-center">
              {appleError}
            </p>
          )}
          <p className="text-xs text-slate-500 text-center">
            Sign in to sync your progress across devices.
          </p>

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
              audioManager.initializeOnUserInteraction();
              audioManager.playSfx('UI_click');
              setIsMenuOpen(true);
              setShowDebug(false);
            }}
            className="w-full py-3 bg-white text-slate-500 font-bold rounded-xl border-2 border-slate-200"
          >
            Settings
          </button>
        </div>

        {/* Start Screen Settings Overlay */}
        {isMenuOpen && (
           <div className="fixed inset-0 bg-black/50 z-50 flex justify-start">
             <div className="w-80 bg-white h-full shadow-2xl overflow-y-auto">
               <div
                 className="sticky top-0 z-10 bg-slate-900 text-white"
                 style={{ paddingTop: 'calc(env(safe-area-inset-top) + 74px)' }}
               >
                 <div className="px-6 pb-4 flex justify-between items-center">
                   <h2
                     className="text-xl font-bold cursor-pointer hover:text-white/90 transition-colors"
                     onClick={() => {
                       triggerHaptic('light');
                       audioManager.playSfx('UI_click');
                       setShowDebug(!showDebug);
                     }}
                     title="Tap to toggle debug tools"
                   >
                     Settings
                   </h2>
                   <button
                     onClick={() => {
                       triggerHaptic('light');
                       audioManager.playSfx('UI_click');
                       setIsMenuOpen(false);
                       setShowDebug(false);
                     }}
                     className="p-2 text-white/80 hover:text-white"
                     aria-label="Close settings"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 </div>
               </div>

               <div className="p-6 pt-4">
                 {renderSettingsPanel()}
               </div>
             </div>
             <div className="flex-1" onClick={() => {
               setIsMenuOpen(false);
               setShowDebug(false);
             }}></div>
           </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="game-root no-touch-action select-none">
      <div className="game-bg" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="game-content">
      {/* In-Game Settings Overlay */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => {
              setIsMenuOpen(false);
              setShowDebug(false);
            }}
          />
          <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out">
            <div
              className="sticky top-0 z-10 bg-slate-900 text-white"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 74px)' }}
            >
              <div className="px-6 pb-4 flex justify-between items-center">
                <h2
                  className="text-xl font-bold cursor-pointer hover:text-white/90 transition-colors"
                  onClick={() => {
                    triggerHaptic('light');
                    audioManager.playSfx('UI_click');
                    setShowDebug(!showDebug);
                  }}
                  title="Tap to toggle debug tools"
                >
                  Settings
                </h2>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowDebug(false);
                    triggerHaptic('light');
                    audioManager.playSfx('UI_click');
                  }}
                  className="p-2 text-white/80 hover:text-white"
                  aria-label="Close settings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 pt-4">
              {renderSettingsPanel()}
            </div>
          </div>
        </>
      )}

      {/* Header / HUD */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 relative z-10" style={{ marginTop: '24px' }}>
        <button 
          onClick={() => {
            triggerHaptic('light');
            audioManager.initializeOnUserInteraction();
            audioManager.playSfx('UI_click');
            setIsMenuOpen(true);
            setShowDebug(false);
          }}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daily Reword</h1>
            {isEndlessMode && <div className="text-xs font-bold text-purple-600 uppercase tracking-widest">Streak: {streak}</div>}
        </div>
        
        <ProfileButton
          isAnonymous={authUser?.isAnonymous ?? true}
          userEmail={authUser?.email ?? null}
          onClick={() => {
            triggerHaptic('light');
            audioManager.playSfx('UI_click');
            setShowSignInModal(true);
          }}
        />
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
                                audioManager.playSfx('UI_click');
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
                                audioManager.playSfx('UI_click');
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
                                audioManager.playSfx('UI_click');
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
                board-slot
                ${slot.stagedTile ? 'board-slot--staged' : ''}
                w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20
                flex items-center justify-center relative
              `}
            >
              <span className={`board-slot-letter text-3xl ${slot.stagedTile ? 'opacity-0' : 'opacity-100'}`}>
                {slot.lockedChar}
              </span>

              {slot.stagedTile && (
                <div 
                  className="absolute inset-0 p-1 animate-pop"
                  onMouseDown={(e) => handleDragStart(e, slot.stagedTile!, 'board', slot.index)}
                  onTouchStart={(e) => handleDragStart(e, slot.stagedTile!, 'board', slot.index)}
                >
                  <div className={`
                    tile tile--board
                    w-full h-full
                    flex items-center justify-center text-2xl cursor-grab
                    ${dragState.isDragging && dragState.source?.type === 'board' && dragState.source.index === slot.index ? 'opacity-0' : 'opacity-100'}
                  `}>
                    <span className="tile-letter tile-letter--board">
                      {slot.stagedTile.char}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rack */}
        <div className="w-full flex items-center justify-center" data-rack-area="true">
          <div className="rack-row">
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
            {Array.from({ length: Math.max(0, WORD_LENGTH - rackTiles.length) }).map((_, idx) => (
              <div
                key={`placeholder-${idx}`}
                className="tile tile--placeholder w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
              />
            ))}
          </div>
        </div>

      </div>

      {/* Controls */}
      <div className="controls-row mt-6">
        <button
          onClick={handleUndo}
          disabled={!boardSlots.some(s => s.stagedTile) || undoJustUsed}
          className="controls-icon-btn"
          aria-label="Undo move"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 7L4 10L7 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 10H13C16.3137 10 19 12.6863 19 16V17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          onClick={handleSubmit}
          disabled={!boardSlots.some(s => s.stagedTile)}
          className="controls-submit-btn"
        >
          Submit
        </button>
        <button
          onClick={handleShuffle}
          disabled={rackTiles.length < 2}
          className="controls-icon-btn"
          aria-label="Shuffle rack tiles"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7H7.5C9.433 7 11 8.567 11 10.5C11 12.433 12.567 14 14.5 14H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M16 5L20 7L16 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 17H9.5C11.433 17 13 15.433 13 13.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M18 15L20 17L18 19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {dragState.isDragging && dragState.tile && renderTile(dragState.tile, true)}

      {status === 'loading' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading Puzzle #{currentPuzzleIndex === -1 ? 'Custom' : currentPuzzleIndex + 1}...</p>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        isAnonymous={authUser?.isAnonymous ?? true}
        userEmail={authUser?.email ?? null}
      />
      </div>
    </div>
  );
};

export default App;
