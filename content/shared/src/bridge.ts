/**
 * Native Bridge Interface
 * 
 * This interface defines the contract between content (React web apps) and
 * the native container (Capacitor iOS app). Content must never depend on
 * the concrete implementation.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';

export interface AppInfo {
  version: string;
  build: number;
}

export interface Entitlements {
  removeAds: boolean;
}

export interface NativeBridge {
  /**
   * Get app version and build number
   */
  getAppInfo(): Promise<AppInfo>;

  /**
   * Get current entitlements (e.g., Remove Ads purchase status)
   */
  getEntitlements(): Promise<Entitlements>;

  /**
   * Show an interstitial ad. Returns true if ad was shown, false otherwise.
   * Will not show if Remove Ads entitlement is active.
   */
  showInterstitialAd(): Promise<boolean>;

  /**
   * Trigger haptic feedback
   */
  haptic(type: HapticType): void;

  /**
   * Play a sound effect by ID
   */
  playSound(id: string): void;

  /**
   * Log an analytics event
   */
  analytics(event: string, params?: Record<string, any>): void;

  /**
   * Debug methods (only available in debug builds)
   */
  debug?: {
    /**
     * Set game state (for testing)
     */
    setGameState(state: unknown): void;

    /**
     * Reset all local data
     */
    resetLocalData(): void;

    /**
     * Force a content refresh
     */
    forceContentRefresh(): void;
  };
}

/**
 * Bridge implementation wrapper for Capacitor
 * This provides a type-safe interface to the native bridge
 */
class BridgeImpl implements NativeBridge {
  private getPlugin() {
    // @ts-ignore - Capacitor plugin will be registered at runtime
    return window.Capacitor?.Plugins?.GameBridge;
  }

  async getAppInfo(): Promise<AppInfo> {
    const plugin = this.getPlugin();
    if (!plugin) {
      throw new Error('GameBridge plugin not available');
    }
    return await plugin.getAppInfo();
  }

  async getEntitlements(): Promise<Entitlements> {
    const plugin = this.getPlugin();
    if (!plugin) {
      throw new Error('GameBridge plugin not available');
    }
    return await plugin.getEntitlements();
  }

  async showInterstitialAd(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) {
      return false;
    }
    try {
      return await plugin.showInterstitialAd();
    } catch (error) {
      console.error('Failed to show ad:', error);
      return false;
    }
  }

  haptic(type: HapticType): void {
    const plugin = this.getPlugin();
    if (!plugin) {
      return;
    }
    try {
      plugin.haptic({ type });
    } catch (error) {
      console.error('Failed to trigger haptic:', error);
    }
  }

  playSound(id: string): void {
    const plugin = this.getPlugin();
    if (!plugin) {
      return;
    }
    try {
      plugin.playSound({ id });
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  analytics(event: string, params?: Record<string, any>): void {
    const plugin = this.getPlugin();
    if (!plugin) {
      return;
    }
    try {
      plugin.analytics({ event, params: params || {} });
    } catch (error) {
      console.error('Failed to log analytics:', error);
    }
  }

  get debug() {
    const plugin = this.getPlugin();
    if (!plugin || !plugin.debug) {
      return undefined;
    }
    return {
      setGameState: (state: unknown) => {
        try {
          plugin.debug.setGameState({ state });
        } catch (error) {
          console.error('Failed to set game state:', error);
        }
      },
      resetLocalData: () => {
        try {
          plugin.debug.resetLocalData();
        } catch (error) {
          console.error('Failed to reset local data:', error);
        }
      },
      forceContentRefresh: () => {
        try {
          plugin.debug.forceContentRefresh();
        } catch (error) {
          console.error('Failed to force content refresh:', error);
        }
      },
    };
  }
}

/**
 * Singleton bridge instance
 * Import this in your content projects to access native capabilities
 */
export const bridge: NativeBridge = new BridgeImpl();
