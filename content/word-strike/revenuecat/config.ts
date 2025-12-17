export const REVENUECAT_API_KEY: string =
  (import.meta as any).env?.VITE_REVENUECAT_API_KEY ||
  // Fallback for local testing. Prefer setting VITE_REVENUECAT_API_KEY in your env.
  'test_huHNCbKSqooXyUzSFKEYXsgVRJI';

/**
 * IMPORTANT:
 * RevenueCat checks entitlements by *identifier* (not display name).
 * Create an entitlement in RevenueCat with this exact identifier.
 */
export const REVENUECAT_PRO_ENTITLEMENT_ID: string =
  (import.meta as any).env?.VITE_REVENUECAT_PRO_ENTITLEMENT_ID || 'Hightop Games Pro';

/** Optional: set if you want to force a specific Offering identifier. */
export const REVENUECAT_OFFERING_ID: string | undefined =
  (import.meta as any).env?.VITE_REVENUECAT_OFFERING_ID || undefined;

/** Package identifiers you said you want in your Offering. */
export const REVENUECAT_PACKAGE_IDS = {
  monthly: 'monthly',
  yearly: 'yearly',
  lifetime: 'lifetime',
  consumable: 'consumable',
} as const;

export type RevenueCatPackageId = (typeof REVENUECAT_PACKAGE_IDS)[keyof typeof REVENUECAT_PACKAGE_IDS];
