import { useMemo } from 'react';
import { REVENUECAT_PACKAGE_IDS, REVENUECAT_PRO_ENTITLEMENT_ID } from '../revenuecat/config';
import { useRevenueCat } from '../revenuecat/RevenueCatProvider';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';

export function ProSubscriptionPanel({ title = 'Hightop Games Pro' }: { title?: string }) {
  const {
    isNativeSupported,
    isConfigured,
    isLoading,
    lastError,
    isPro,
    customerInfo,
    offerings,
    refresh,
    restorePurchases,
    purchasePackageById,
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
  } = useRevenueCat();

  const currentOfferingId = offerings?.current?.identifier || null;
  const availablePackageIds = useMemo(() => {
    const pkgs: PurchasesPackage[] = offerings?.current?.availablePackages || [];
    return new Set(pkgs.map((p: PurchasesPackage) => p.identifier));
  }, [offerings]);

  const statusLabel = !isNativeSupported
    ? 'Not available on web'
    : !isConfigured
      ? 'Initializing…'
      : isPro
        ? 'Active'
        : 'Not active';

  return (
    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-700">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Entitlement: <span className="font-mono">{REVENUECAT_PRO_ENTITLEMENT_ID}</span>
          </p>
        </div>
        <span
          className={
            'text-xs font-bold px-2 py-1 rounded ' +
            (isPro ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600')
          }
        >
          {statusLabel}
        </span>
      </div>

      {isNativeSupported && (
        <div className="text-xs text-slate-500 mt-3 space-y-1">
          <div>
            <span className="font-semibold">App User ID:</span>{' '}
            <span className="font-mono break-all">{customerInfo?.originalAppUserId || 'unknown'}</span>
          </div>
          <div>
            <span className="font-semibold">Offering:</span>{' '}
            <span className="font-mono">{currentOfferingId || 'none'}</span>
          </div>
          <div>
            <span className="font-semibold">Active subscriptions:</span>{' '}
            <span className="font-mono">{(customerInfo?.activeSubscriptions || []).join(', ') || 'none'}</span>
          </div>
        </div>
      )}

      {lastError && (
        <p className="text-xs text-red-600 mt-3 break-words">RevenueCat error: {lastError}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => presentPaywallIfNeeded({ requiredEntitlementIdentifier: REVENUECAT_PRO_ENTITLEMENT_ID })}
          disabled={!isNativeSupported || !isConfigured || isLoading}
          className="px-3 py-2 bg-amber-500 text-white text-sm font-bold rounded hover:bg-amber-600 disabled:opacity-50"
        >
          Upgrade (Paywall)
        </button>

        <button
          onClick={() => presentCustomerCenter()}
          disabled={!isNativeSupported || !isConfigured || isLoading}
          className="px-3 py-2 bg-slate-800 text-white text-sm font-bold rounded hover:bg-slate-900 disabled:opacity-50"
        >
          Customer Center
        </button>

        <button
          onClick={() => restorePurchases()}
          disabled={!isNativeSupported || !isConfigured || isLoading}
          className="px-3 py-2 bg-white text-slate-700 text-sm font-bold rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          Restore
        </button>

        <button
          onClick={() => refresh()}
          disabled={!isNativeSupported || !isConfigured || isLoading}
          className="px-3 py-2 bg-white text-slate-700 text-sm font-bold rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Optional: direct purchase buttons (useful for debugging/QA) */}
      <div className="mt-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Products</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => purchasePackageById(REVENUECAT_PACKAGE_IDS.monthly)}
            disabled={!availablePackageIds.has(REVENUECAT_PACKAGE_IDS.monthly) || !isNativeSupported || !isConfigured || isLoading}
            className="px-3 py-2 bg-white text-slate-700 text-sm font-semibold rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            Monthly
          </button>
          <button
            onClick={() => purchasePackageById(REVENUECAT_PACKAGE_IDS.yearly)}
            disabled={!availablePackageIds.has(REVENUECAT_PACKAGE_IDS.yearly) || !isNativeSupported || !isConfigured || isLoading}
            className="px-3 py-2 bg-white text-slate-700 text-sm font-semibold rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            Yearly
          </button>
          <button
            onClick={() => purchasePackageById(REVENUECAT_PACKAGE_IDS.lifetime)}
            disabled={!availablePackageIds.has(REVENUECAT_PACKAGE_IDS.lifetime) || !isNativeSupported || !isConfigured || isLoading}
            className="px-3 py-2 bg-white text-slate-700 text-sm font-semibold rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            Lifetime
          </button>
          <button
            onClick={() => purchasePackageById(REVENUECAT_PACKAGE_IDS.consumable)}
            disabled={!availablePackageIds.has(REVENUECAT_PACKAGE_IDS.consumable) || !isNativeSupported || !isConfigured || isLoading}
            className="px-3 py-2 bg-white text-slate-700 text-sm font-semibold rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            Consumable
          </button>
        </div>

        <button
          onClick={() => presentPaywall({ displayCloseButton: true })}
          disabled={!isNativeSupported || !isConfigured || isLoading}
          className="mt-2 w-full px-3 py-2 bg-blue-500 text-white text-sm font-bold rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Show Paywall (explicit)
        </button>
      </div>

      {!isNativeSupported && (
        <p className="text-xs text-slate-500 mt-3">
          RevenueCat only runs on iOS/Android. Use the native build to test purchases.
        </p>
      )}
    </div>
  );
}
