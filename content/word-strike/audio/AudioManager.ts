/**
 * AudioManager
 * Handles background music and sound effects playback
 * Preloads all audio for instant playback
 */

class AudioManager {
  private musicAudio: HTMLAudioElement | null = null;
  private currentMusicTrack: number = -1;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private musicTracks: string[] = ['music_1.mp3', 'music_2.mp3', 'music_3.mp3', 'music_4.mp3', 'music_5.mp3'];
  private sfxCache: Map<string, HTMLAudioElement[]> = new Map(); // Pool of preloaded audio elements
  private musicPreloaded: HTMLAudioElement[] = [];
  private isPreloading: boolean = false;

  constructor() {
    this.loadSettings();
    // Preload all audio files for instant playback
    this.preloadAllAudio();
  }

  private loadSettings(): void {
    try {
      const musicVol = localStorage.getItem('settings.musicVolume');
      if (musicVol !== null) {
        this.musicVolume = parseFloat(musicVol);
      }

      const sfxVol = localStorage.getItem('settings.sfxVolume');
      if (sfxVol !== null) {
        this.sfxVolume = parseFloat(sfxVol);
      }

      const musicEnabled = localStorage.getItem('settings.musicEnabled');
      if (musicEnabled !== null) {
        this.musicEnabled = musicEnabled === 'true';
      }

      const sfxEnabled = localStorage.getItem('settings.sfxEnabled');
      if (sfxEnabled !== null) {
        this.sfxEnabled = sfxEnabled === 'true';
      }
    } catch (e) {
      console.warn('Failed to load audio settings:', e);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('settings.musicVolume', this.musicVolume.toString());
      localStorage.setItem('settings.sfxVolume', this.sfxVolume.toString());
      localStorage.setItem('settings.musicEnabled', this.musicEnabled.toString());
      localStorage.setItem('settings.sfxEnabled', this.sfxEnabled.toString());
    } catch (e) {
      console.warn('Failed to save audio settings:', e);
    }
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    const effectiveVolume = this.musicEnabled ? this.musicVolume : 0;
    
    // Update currently playing music - this is the most important one
    if (this.musicAudio) {
      // Set volume multiple times to ensure browser applies it
      this.musicAudio.volume = effectiveVolume;
      // Some browsers need a small delay or re-set
      setTimeout(() => {
        if (this.musicAudio) {
          this.musicAudio.volume = effectiveVolume;
        }
      }, 0);
    }
    
    // Update volume on all preloaded music tracks for future use
    this.musicPreloaded.forEach(audio => {
      if (audio) {
        audio.volume = effectiveVolume;
      }
    });
    this.saveSettings();
  }

  // Public method to get the current music audio element (for direct volume control if needed)
  getCurrentMusicAudio(): HTMLAudioElement | null {
    return this.musicAudio;
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    // Update volume on all cached SFX audio elements
    this.sfxCache.forEach((audioPool) => {
      audioPool.forEach(audio => {
        if (audio) {
          audio.volume = this.sfxVolume;
          // Ensure volume is actually set
          if (audio.volume !== this.sfxVolume) {
            audio.volume = this.sfxVolume;
          }
        }
      });
    });
    this.saveSettings();
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (this.musicAudio) {
      this.musicAudio.volume = enabled ? this.musicVolume : 0;
    }
    this.saveSettings();
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    this.saveSettings();
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  getSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  private preloadAllAudio(): void {
    if (this.isPreloading) return;
    this.isPreloading = true;

    // Preload all music tracks
    this.musicTracks.forEach((track, index) => {
      const audio = new Audio(`/music/${track}`);
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = this.musicEnabled ? this.musicVolume : 0;
      // Load the audio
      audio.load();
      this.musicPreloaded[index] = audio;
    });

    // Preload all SFX files - create a pool of 3 instances per sound for overlapping
    const sfxFiles = [
      'UI_click.wav',
      'UI_toggle.wav',
      'tile_pickup.wav',
      'tile_release.wav',
      'word_valid.wav',
      'word_wrong.wav',
      'puzzle_win_perfect.wav',
      'puzzle_win_okay.wav',
    ];

    sfxFiles.forEach(filename => {
      const pool: HTMLAudioElement[] = [];
      for (let i = 0; i < 3; i++) {
        const audio = new Audio(`/sfx/${filename}`);
        audio.preload = 'auto';
        audio.volume = this.sfxVolume;
        audio.load();
        pool.push(audio);
      }
      this.sfxCache.set(filename, pool);
    });

    this.isPreloading = false;
  }

  playRandomMusicTrack(): void {
    if (!this.musicEnabled || this.musicTracks.length === 0) {
      return;
    }

    // Choose a different track than current if possible
    let trackIndex: number;
    if (this.musicTracks.length > 1) {
      const availableIndices = this.musicTracks
        .map((_, idx) => idx)
        .filter(idx => idx !== this.currentMusicTrack);
      trackIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      trackIndex = 0;
    }

    this.currentMusicTrack = trackIndex;

    // Stop current music if playing
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
      this.musicAudio = null;
    }

    // Use preloaded audio
    if (this.musicPreloaded[trackIndex]) {
      this.musicAudio = this.musicPreloaded[trackIndex];
      this.musicAudio.currentTime = 0;
      const effectiveVolume = this.musicEnabled ? this.musicVolume : 0;
      this.musicAudio.volume = effectiveVolume;
      
      // Ensure volume is set - sometimes browsers need this to be set after play()
      const playPromise = this.musicAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Volume might reset after play, so set it again
          this.musicAudio!.volume = effectiveVolume;
        }).catch((error) => {
          console.warn('Failed to play music:', error);
          // User interaction may be required - music will start on next puzzle
        });
      }
    }
  }

  stopMusic(): void {
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio = null;
    }
    this.currentMusicTrack = -1;
  }

  onNewPuzzle(): void {
    this.playRandomMusicTrack();
  }

  playSfx(name: string): void {
    if (!this.sfxEnabled || this.sfxVolume === 0) {
      return;
    }

    // Map common names to filenames
    const filenameMap: Record<string, string> = {
      'UI_click': 'UI_click.wav',
      'UI_toggle': 'UI_toggle.wav',
      'tile_pickup': 'tile_pickup.wav',
      'tile_release': 'tile_release.wav',
      'word_valid': 'word_valid.wav',
      'word_wrong': 'word_wrong.wav',
      'puzzle_win_perfect': 'puzzle_win_perfect.wav',
      'puzzle_win_okay': 'puzzle_win_okay.wav',
    };

    const filename = filenameMap[name] || name;
    const audioPool = this.sfxCache.get(filename);

    if (!audioPool || audioPool.length === 0) {
      // Fallback: create on-demand if not preloaded yet
      const audio = new Audio(`/sfx/${filename}`);
      audio.volume = this.sfxVolume;
      audio.play().catch(() => {});
      return;
    }

    // Find an available audio element from the pool (not currently playing)
    let audio = audioPool.find(a => a.paused || a.ended);
    if (!audio) {
      // All are playing, use the first one and restart it
      audio = audioPool[0];
      audio.currentTime = 0;
    }

    // Ensure volume is current - set it multiple times to ensure it takes effect
    audio.volume = this.sfxVolume;
    // Force a re-set to ensure browser applies it
    if (audio.volume !== this.sfxVolume) {
      audio.volume = this.sfxVolume;
    }
    audio.currentTime = 0;
    
    audio.play().catch((error) => {
      // Silently fail - user interaction may be required
      console.debug('SFX play failed (may need user interaction):', error);
    });
  }

  pauseMusic(): void {
    if (this.musicAudio && !this.musicAudio.paused) {
      this.musicAudio.pause();
    }
  }

  resumeMusic(): void {
    if (this.musicAudio && this.musicAudio.paused && this.musicEnabled) {
      this.musicAudio.play().catch((error) => {
        console.warn('Failed to resume music:', error);
      });
    }
  }

  // Cleanup method (call on app unmount if needed)
  destroy(): void {
    this.stopMusic();
    this.musicPreloaded.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.musicPreloaded = [];
    this.sfxCache.forEach((pool) => {
      pool.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    });
    this.sfxCache.clear();
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
