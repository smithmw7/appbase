/**
 * TypeScript definitions for AdMob plugin
 */

export interface AdMobPlugin {
  /**
   * Load an interstitial ad
   */
  loadInterstitial(options: { adUnitId: string }): Promise<void>;

  /**
   * Show an interstitial ad if loaded
   */
  showInterstitial(): Promise<{ shown: boolean }>;

  /**
   * Check if an ad is loaded
   */
  isInterstitialLoaded(): Promise<{ loaded: boolean }>;
}
