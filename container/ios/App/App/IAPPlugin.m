#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Objective-C bridge for IAPPlugin
CAP_PLUGIN(IAPPlugin, "IAP",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(hasRemoveAds, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(purchaseRemoveAds, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(restorePurchases, CAPPluginReturnPromise);
)
