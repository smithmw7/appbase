/**
 * Native Bridge Interface
 * 
 * This interface defines the contract between content (React web apps) and
 * the native container (Capacitor iOS app). Content must never depend on
 * the concrete implementation.
 */

import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Extend Window interface for Capacitor runtime
declare global {
  interface Window {
    Capacitor?: {
      Plugins?: {
        GameBridge?: any;
      };
    };
  }
}

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
  private getGameBridgePlugin() {
    // @ts-ignore - Capacitor plugin will be registered at runtime
    return window.Capacitor?.Plugins?.GameBridge;
  }

  private ensureCapacitorRuntime(): void {
    if (typeof window === 'undefined') {
      throw new Error('Capacitor runtime not available: window is undefined');
    }
    if (!window.Capacitor) {
      throw new Error('Capacitor runtime not loaded: window.Capacitor is undefined. Ensure capacitor.js is loaded before the app bundle.');
    }
  }

  async getAppInfo(): Promise<AppInfo> {
    this.ensureCapacitorRuntime();
    try {
      const info = await App.getInfo();
      // Capacitor returns build as string on some platforms; normalize to number.
      const build = typeof info.build === 'number' ? info.build : Number.parseInt(String(info.build), 10);
      if (!Number.isFinite(build)) throw new Error(`Invalid build from App.getInfo(): ${String(info.build)}`);
      return { version: info.version, build };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get app info: ${message}`);
    }
  }

  async getEntitlements(): Promise<Entitlements> {
    const plugin = this.getGameBridgePlugin();
    if (!plugin) {
      throw new Error('GameBridge plugin not available');
    }
    return await plugin.getEntitlements();
  }

  async showInterstitialAd(): Promise<boolean> {
    const plugin = this.getGameBridgePlugin();
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
    this.ensureCapacitorRuntime();
    try {
      if (type === 'success') {
        void Haptics.notification({ type: NotificationType.Success });
        return;
      }
      if (type === 'error') {
        void Haptics.notification({ type: NotificationType.Error });
        return;
      }

      const style =
        type === 'light' ? ImpactStyle.Light : type === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy;
      void Haptics.impact({ style });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to trigger haptic:', error);
      throw new Error(`Haptic failed: ${message}`);
    }
  }

  playSound(id: string): void {
    const plugin = this.getGameBridgePlugin();
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
    const plugin = this.getGameBridgePlugin();
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
    const plugin = this.getGameBridgePlugin();
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
