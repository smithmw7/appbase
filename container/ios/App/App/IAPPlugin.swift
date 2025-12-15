import Foundation
import Capacitor
#if canImport(Purchases)
import Purchases
#endif

/**
 * IAPPlugin
 *
 * Minimal wrapper for RevenueCat "Remove Ads" entitlement.
 * If Purchases SDK is not available, returns defaults.
 */
@objc(IAPPlugin)
public class IAPPlugin: CAPPlugin {
    private var isInitialized = false
    private let entitlementId = "remove_ads"

    // MARK: - Initialize
    @objc func initialize(_ call: CAPPluginCall) {
        #if canImport(Purchases)
        if let apiKey = Bundle.main.infoDictionary?["RevenueCatAPIKey"] as? String {
            Purchases.configure(withAPIKey: apiKey)
            isInitialized = true
            call.resolve()
            return
        }
        call.reject("RevenueCatAPIKey missing in Info.plist")
        #else
        isInitialized = true
        call.resolve()
        #endif
    }

    // MARK: - Check Entitlement
    @objc func hasRemoveAds(_ call: CAPPluginCall) {
        #if canImport(Purchases)
        guard isInitialized else {
            call.reject("IAP not initialized")
            return
        }
        Purchases.shared.getCustomerInfo { customerInfo, error in
            if let error = error {
                call.reject("Failed to get customer info: \(error.localizedDescription)")
                return
            }
            let hasEntitlement = customerInfo?.entitlements[self.entitlementId]?.isActive == true
            UserDefaults.standard.set(hasEntitlement, forKey: "removeAds")
            call.resolve(["hasEntitlement": hasEntitlement])
        }
        #else
        call.resolve(["hasEntitlement": false])
        #endif
    }

    // MARK: - Purchase
    @objc func purchaseRemoveAds(_ call: CAPPluginCall) {
        #if canImport(Purchases)
        guard isInitialized else {
            call.reject("IAP not initialized")
            return
        }

        guard let productId = Bundle.main.infoDictionary?["RemoveAdsProductID"] as? String else {
            call.reject("RemoveAdsProductID missing in Info.plist")
            return
        }

        Purchases.shared.getOfferings { offerings, error in
            if let error = error {
                call.reject("Failed to get offerings: \(error.localizedDescription)")
                return
            }
            guard let package = offerings?.current?.availablePackages.first(where: { $0.storeProduct.productIdentifier == productId }) else {
                call.reject("Remove Ads product not found")
                return
            }
            Purchases.shared.purchase(package: package) { _, customerInfo, error, userCancelled in
                if userCancelled {
                    call.resolve(["success": false])
                    return
                }
                if let error = error {
                    call.reject("Purchase failed: \(error.localizedDescription)")
                    return
                }
                let hasEntitlement = customerInfo?.entitlements[self.entitlementId]?.isActive == true
                UserDefaults.standard.set(hasEntitlement, forKey: "removeAds")
                call.resolve(["success": hasEntitlement])
            }
        }
        #else
        call.resolve(["success": false])
        #endif
    }

    // MARK: - Restore
    @objc func restorePurchases(_ call: CAPPluginCall) {
        #if canImport(Purchases)
        guard isInitialized else {
            call.reject("IAP not initialized")
            return
        }
        Purchases.shared.restorePurchases { customerInfo, error in
            if let error = error {
                call.reject("Restore failed: \(error.localizedDescription)")
                return
            }
            let hasEntitlement = customerInfo?.entitlements[self.entitlementId]?.isActive == true
            UserDefaults.standard.set(hasEntitlement, forKey: "removeAds")
            call.resolve(["restored": hasEntitlement])
        }
        #else
        call.resolve(["restored": false])
        #endif
    }
}
