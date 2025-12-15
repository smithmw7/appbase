/**
 * TypeScript definitions for GameBridge plugin
 * These match the NativeBridge interface in content/shared
 */

export interface GameBridgePlugin {
  /**
   * Get app version and build number
   */
  getAppInfo(): Promise<{ version: string; build: number }>;

  /**
   * Get current entitlements
   */
  getEntitlements(): Promise<{ removeAds: boolean }>;

  /**
   * Show an interstitial ad
   */
  showInterstitialAd(): Promise<{ shown: boolean }>;

  /**
   * Trigger haptic feedback
   */
  haptic(options: { type: 'light' | 'medium' | 'heavy' | 'success' | 'error' }): void;

  /**
   * Play a sound effect
   */
  playSound(options: { id: string }): void;

  /**
   * Log an analytics event
   */
  analytics(options: { event: string; params?: Record<string, any> }): void;

  /**
   * Debug methods (only available in debug builds)
   */
  debug?: {
    setGameState(options: { state: unknown }): void;
    resetLocalData(): Promise<void>;
    forceContentRefresh(): void;
  };
}
