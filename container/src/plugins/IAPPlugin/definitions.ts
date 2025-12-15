/**
 * TypeScript definitions for IAP plugin (RevenueCat)
 */

export interface IAPPlugin {
  /**
   * Initialize the IAP system
   */
  initialize(): Promise<void>;

  /**
   * Check if user has Remove Ads entitlement
   */
  hasRemoveAds(): Promise<{ hasEntitlement: boolean }>;

  /**
   * Purchase Remove Ads
   */
  purchaseRemoveAds(): Promise<{ success: boolean }>;

  /**
   * Restore purchases
   */
  restorePurchases(): Promise<{ restored: boolean }>;
}
