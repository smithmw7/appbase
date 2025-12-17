import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  LOG_LEVEL,
  Purchases,
  PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { RevenueCatUI } from '@revenuecat/purchases-capacitor-ui';
import type { CustomerInfo, PurchasesOffering, PurchasesOfferings } from '@revenuecat/purchases-capacitor';
import { REVENUECAT_API_KEY, REVENUECAT_OFFERING_ID, REVENUECAT_PRO_ENTITLEMENT_ID } from './config';

type RevenueCatStatus = {
  isNativeSupported: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  lastError: string | null;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  isPro: boolean;
};

type RevenueCatActions = {
  /** Call when your app-level user ID becomes known (login) or cleared (logout). */
  setAppUserId: (appUserId: string | null) => Promise<void>;

  refresh: () => Promise<void>;
  restorePurchases: () => Promise<void>;

  /** Purchase a package from the current offering by its package identifier. */
  purchasePackageById: (packageIdentifier: string) => Promise<void>;

  /** Paywalls */
  presentPaywall: (opts?: { offeringIdentifier?: string; displayCloseButton?: boolean }) => Promise<void>;
  presentPaywallIfNeeded: (opts?: {
    requiredEntitlementIdentifier?: string;
    offeringIdentifier?: string;
    displayCloseButton?: boolean;
  }) => Promise<void>;

  /** Customer Center */
  presentCustomerCenter: () => Promise<void>;
};

type RevenueCatContextValue = RevenueCatStatus & RevenueCatActions;

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

function isProFromCustomerInfo(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  const ent = (customerInfo.entitlements?.active as any) || {};
  return Boolean(ent[REVENUECAT_PRO_ENTITLEMENT_ID]);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function findPackage(offerings: PurchasesOfferings | null, packageIdentifier: string): PurchasesPackage | null {
  const current = offerings?.current;
  if (!current) return null;

  const allPackages: PurchasesPackage[] = current.availablePackages || [];
  return allPackages.find((p: PurchasesPackage) => p.identifier === packageIdentifier) || null;
}

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const isNativeSupported = useMemo(() => Capacitor.isNativePlatform(), []);

  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);

  const configureStartedRef = useRef(false);
  const lastAppUserIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isNativeSupported || !isConfigured) return;

    setIsLoading(true);
    try {
      const [ciRes, off] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
      setCustomerInfo(ciRes.customerInfo);
      setOfferings(off);
      setLastError(null);
    } catch (e) {
      setLastError(toErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, isNativeSupported]);

  // Configure once on mount (native only)
  useEffect(() => {
    if (!isNativeSupported) return;
    if (configureStartedRef.current) return;

    configureStartedRef.current = true;

    (async () => {
      setIsLoading(true);
      try {
        await Purchases.setLogLevel({ level: (import.meta as any).env?.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO });
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });

        await Purchases.addCustomerInfoUpdateListener((ci: any) => {
          // Some versions pass CustomerInfo directly, others wrap it.
          setCustomerInfo(ci?.customerInfo ?? ci);
        });

        setIsConfigured(true);
        setLastError(null);

        // Initial fetch
        await refresh();
      } catch (e) {
        setLastError(toErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isNativeSupported, refresh]);

  const setAppUserId = useCallback(
    async (appUserId: string | null) => {
      if (!isNativeSupported) return;
      if (!isConfigured) {
        // Defer until configured.
        lastAppUserIdRef.current = appUserId;
        return;
      }

      if (lastAppUserIdRef.current === appUserId) return;
      lastAppUserIdRef.current = appUserId;

      setIsLoading(true);
      try {
        if (appUserId && appUserId.trim().length > 0) {
          const result = await Purchases.logIn({ appUserID: appUserId });
          setCustomerInfo(result.customerInfo);
        } else {
          const result = await Purchases.logOut();
          setCustomerInfo(result.customerInfo);
        }
        setLastError(null);
      } catch (e) {
        setLastError(toErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    },
    [isConfigured, isNativeSupported]
  );

  // If setAppUserId was called before configure finished, apply it once configured.
  useEffect(() => {
    if (!isConfigured) return;
    if (lastAppUserIdRef.current == null) return;

    // Kick a best-effort sync (don’t block render)
    void setAppUserId(lastAppUserIdRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured]);

  const purchasePackageById = useCallback(
    async (packageIdentifier: string) => {
      if (!isNativeSupported || !isConfigured) return;

      setIsLoading(true);
      try {
        const pkg = findPackage(offerings, packageIdentifier);
        if (!pkg) {
          throw new Error(
            `Package '${packageIdentifier}' not found in current Offering. Check RevenueCat Offerings/Packages configuration.`
          );
        }

        const result = await Purchases.purchasePackage({ aPackage: pkg });
        setCustomerInfo(result.customerInfo);
        setLastError(null);
      } catch (e) {
        setLastError(toErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    },
    [isConfigured, isNativeSupported, offerings]
  );

  const restorePurchases = useCallback(async () => {
    if (!isNativeSupported || !isConfigured) return;

    setIsLoading(true);
    try {
      const res = await Purchases.restorePurchases();
      setCustomerInfo(res.customerInfo);
      setLastError(null);
    } catch (e) {
      setLastError(toErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, isNativeSupported]);

  const resolveOfferingToPresent = useCallback(
    (offeringIdentifier?: string): PurchasesOffering | undefined => {
      const id = offeringIdentifier || REVENUECAT_OFFERING_ID;
      if (!id) return undefined;
      return offerings?.all?.[id];
    },
    [offerings]
  );

  const presentPaywall = useCallback(
    async (opts?: { offeringIdentifier?: string; displayCloseButton?: boolean }) => {
      if (!isNativeSupported || !isConfigured) return;

      setIsLoading(true);
      try {
        await RevenueCatUI.presentPaywall({
          offering: resolveOfferingToPresent(opts?.offeringIdentifier),
          displayCloseButton: opts?.displayCloseButton ?? true,
        });
        setLastError(null);
        await refresh();
      } catch (e) {
        setLastError(toErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    },
    [isConfigured, isNativeSupported, refresh]
  );

  const presentPaywallIfNeeded = useCallback(
    async (opts?: {
      requiredEntitlementIdentifier?: string;
      offeringIdentifier?: string;
      displayCloseButton?: boolean;
    }) => {
      if (!isNativeSupported || !isConfigured) return;

      setIsLoading(true);
      try {
        await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: opts?.requiredEntitlementIdentifier || REVENUECAT_PRO_ENTITLEMENT_ID,
          offering: resolveOfferingToPresent(opts?.offeringIdentifier),
          displayCloseButton: opts?.displayCloseButton ?? true,
        });
        setLastError(null);
        await refresh();
      } catch (e) {
        setLastError(toErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    },
    [isConfigured, isNativeSupported, refresh, resolveOfferingToPresent]
  );

  const presentCustomerCenter = useCallback(async () => {
    if (!isNativeSupported || !isConfigured) return;

    setIsLoading(true);
    try {
      await RevenueCatUI.presentCustomerCenter();
      setLastError(null);
      await refresh();
    } catch (e) {
      setLastError(toErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, isNativeSupported, refresh]);

  const value: RevenueCatContextValue = useMemo(
    () => ({
      isNativeSupported,
      isConfigured,
      isLoading,
      lastError,
      customerInfo,
      offerings,
      isPro: isProFromCustomerInfo(customerInfo),

      setAppUserId,
      refresh,
      restorePurchases,
      purchasePackageById,
      presentPaywall,
      presentPaywallIfNeeded,
      presentCustomerCenter,
    }),
    [
      customerInfo,
      isConfigured,
      isLoading,
      isNativeSupported,
      lastError,
      offerings,
      presentCustomerCenter,
      presentPaywall,
      presentPaywallIfNeeded,
      purchasePackageById,
      refresh,
      restorePurchases,
      setAppUserId,
    ]
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCat(): RevenueCatContextValue {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) {
    throw new Error('useRevenueCat must be used within RevenueCatProvider');
  }
  return ctx;
}
