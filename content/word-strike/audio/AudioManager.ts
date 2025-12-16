/**
 * AudioManager
 * Handles background music and sound effects playback using Web Audio API
 * Uses GainNodes for proper volume control on iOS and all platforms
 */

class AudioManager {
  private audioContext: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  
  private currentMusicTrack: number = -1;
  private currentMusicSource: AudioBufferSourceNode | null = null;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  
  private musicTracks: string[] = ['music_1.mp3', 'music_2.mp3', 'music_3.mp3', 'music_4.mp3', 'music_5.mp3'];
  private musicBuffers: Map<string, AudioBuffer> = new Map();
  private sfxBuffers: Map<string, AudioBuffer> = new Map();
  
  private isPreloading: boolean = false;
  private isContextInitialized: boolean = false;

  constructor() {
    this.loadSettings();
  }

  /**
   * Initialize AudioContext on first user interaction (required for iOS)
   * This should be called from a user interaction handler
   */
  private async initializeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      // Resume if suspended (common on iOS)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      return;
    }

    try {
      // Create AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      // Create gain nodes for volume control
      this.musicGainNode = this.audioContext.createGain();
      this.sfxGainNode = this.audioContext.createGain();

      // Connect gain nodes to destination
      this.musicGainNode.connect(this.audioContext.destination);
      this.sfxGainNode.connect(this.audioContext.destination);

      // Set initial volumes
      this.musicGainNode.gain.value = this.musicEnabled ? this.musicVolume : 0;
      this.sfxGainNode.gain.value = this.sfxVolume;

      this.isContextInitialized = true;

      // Start preloading audio files
      this.preloadAllAudio();
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Ensure AudioContext is initialized (call this before any audio operations)
   */
  private async ensureAudioContext(): Promise<void> {
    if (!this.isContextInitialized) {
      await this.initializeAudioContext();
    } else if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
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

  /**
   * Load and decode an audio file to AudioBuffer
   */
  private async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    await this.ensureAudioContext();
    
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio: ${url}`, error);
      throw error;
    }
  }

  /**
   * Preload all audio files
   */
  private async preloadAllAudio(): Promise<void> {
    if (this.isPreloading) return;
    this.isPreloading = true;

    await this.ensureAudioContext();

    if (!this.audioContext) {
      console.warn('Cannot preload audio: AudioContext not initialized');
      this.isPreloading = false;
      return;
    }

    try {
      // Preload music tracks
      const musicPromises = this.musicTracks.map(async (track) => {
        try {
          const buffer = await this.loadAudioBuffer(`/music/${track}`);
          this.musicBuffers.set(track, buffer);
        } catch (error) {
          console.warn(`Failed to preload music: ${track}`, error);
        }
      });

      // Preload SFX files
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

      const sfxPromises = sfxFiles.map(async (filename) => {
        try {
          const buffer = await this.loadAudioBuffer(`/sfx/${filename}`);
          this.sfxBuffers.set(filename, buffer);
        } catch (error) {
          console.warn(`Failed to preload SFX: ${filename}`, error);
        }
      });

      await Promise.all([...musicPromises, ...sfxPromises]);
    } catch (error) {
      console.error('Error during audio preloading:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    const effectiveVolume = this.musicEnabled ? this.musicVolume : 0;
    
    if (this.musicGainNode) {
      // GainNode.gain.value works on iOS!
      this.musicGainNode.gain.value = effectiveVolume;
    }
    
    this.saveSettings();
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    if (this.sfxGainNode) {
      // GainNode.gain.value works on iOS!
      this.sfxGainNode.gain.value = this.sfxVolume;
    }
    
    this.saveSettings();
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    const effectiveVolume = enabled ? this.musicVolume : 0;
    
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = effectiveVolume;
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

  /**
   * Play a music track with looping support
   */
  private playMusicBuffer(buffer: AudioBuffer, trackIndex: number): void {
    if (!this.audioContext || !this.musicGainNode) {
      return;
    }

    // Stop current music
    this.stopMusic();

    // Create new source node
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Connect: source -> music gain node -> destination
    source.connect(this.musicGainNode);

    // Set volume
    const effectiveVolume = this.musicEnabled ? this.musicVolume : 0;
    this.musicGainNode.gain.value = effectiveVolume;

    // Play
    source.start(0);
    this.currentMusicSource = source;
    this.currentMusicTrack = trackIndex;
  }

  async playRandomMusicTrack(): Promise<void> {
    if (!this.musicEnabled || this.musicTracks.length === 0) {
      return;
    }

    await this.ensureAudioContext();
    
    if (!this.audioContext) {
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

    const track = this.musicTracks[trackIndex];
    const buffer = this.musicBuffers.get(track);

    if (buffer) {
      this.playMusicBuffer(buffer, trackIndex);
    } else {
      // Buffer not loaded yet, try to load it
      try {
        const loadedBuffer = await this.loadAudioBuffer(`/music/${track}`);
        this.musicBuffers.set(track, loadedBuffer);
        this.playMusicBuffer(loadedBuffer, trackIndex);
      } catch (error) {
        console.warn('Failed to load music track:', error);
      }
    }
  }

  stopMusic(): void {
    if (this.currentMusicSource) {
      try {
        this.currentMusicSource.stop();
      } catch (e) {
        // Source may already be stopped
      }
      this.currentMusicSource.disconnect();
      this.currentMusicSource = null;
    }
    this.currentMusicTrack = -1;
  }

  onNewPuzzle(): void {
    void this.playRandomMusicTrack();
  }

  async playSfx(name: string): Promise<void> {
    if (!this.sfxEnabled || this.sfxVolume === 0) {
      return;
    }

    await this.ensureAudioContext();
    
    if (!this.audioContext || !this.sfxGainNode) {
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
    const buffer = this.sfxBuffers.get(filename);

    if (buffer) {
      // Create new source node for this SFX (allows overlapping)
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.sfxGainNode);

      // Set volume (already set on gain node, but ensure it's current)
      this.sfxGainNode.gain.value = this.sfxVolume;

      // Play
      source.start(0);

      // Clean up when finished (source nodes are one-shot)
      source.onended = () => {
        source.disconnect();
      };
    } else {
      // Buffer not loaded yet, try to load and play
      try {
        const loadedBuffer = await this.loadAudioBuffer(`/sfx/${filename}`);
        this.sfxBuffers.set(filename, loadedBuffer);
        const source = this.audioContext.createBufferSource();
        source.buffer = loadedBuffer;
        source.connect(this.sfxGainNode);
        this.sfxGainNode.gain.value = this.sfxVolume;
        source.start(0);
        source.onended = () => {
          source.disconnect();
        };
      } catch (error) {
        console.debug('SFX play failed:', error);
      }
    }
  }

  pauseMusic(): void {
    if (this.audioContext && this.audioContext.state !== 'suspended') {
      this.audioContext.suspend().catch((error) => {
        console.warn('Failed to suspend audio context:', error);
      });
    }
  }

  resumeMusic(): void {
    if (this.audioContext && this.audioContext.state === 'suspended' && this.musicEnabled) {
      this.audioContext.resume().catch((error) => {
        console.warn('Failed to resume audio context:', error);
      });
    }
  }

  /**
   * Initialize audio on first user interaction (call this from a button click handler)
   */
  initializeOnUserInteraction(): void {
    if (!this.isContextInitialized) {
      this.initializeAudioContext();
    }
  }

  // Public method for backward compatibility (no longer needed but kept for API compatibility)
  getCurrentMusicAudio(): HTMLAudioElement | null {
    return null; // No longer using HTMLAudioElement
  }

  // Cleanup method
  destroy(): void {
    this.stopMusic();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch((error) => {
        console.warn('Failed to close audio context:', error);
      });
    }
    this.musicBuffers.clear();
    this.sfxBuffers.clear();
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
