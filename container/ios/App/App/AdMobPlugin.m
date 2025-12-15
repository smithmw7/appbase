#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Objective-C bridge for AdMobPlugin
CAP_PLUGIN(AdMobPlugin, "AdMob",
           CAP_PLUGIN_METHOD(loadInterstitial, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(showInterstitial, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(isInterstitialLoaded, CAPPluginReturnPromise);
)
