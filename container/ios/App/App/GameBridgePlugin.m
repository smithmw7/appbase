#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Objective-C bridge for GameBridgePlugin
CAP_PLUGIN(GameBridgePlugin, "GameBridge",
           CAP_PLUGIN_METHOD(getAppInfo, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getEntitlements, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(showInterstitialAd, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(haptic, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(playSound, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(analytics, CAPPluginReturnNone);
#if DEBUG
           CAP_PLUGIN_METHOD(setGameState, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(resetLocalData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(forceContentRefresh, CAPPluginReturnNone);
#endif
)
