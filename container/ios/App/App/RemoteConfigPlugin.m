#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(RemoteConfigPlugin, "RemoteConfig",
           CAP_PLUGIN_METHOD(fetchRemoteConfig, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getPuzzleDataUrl, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getRemoteConfigValue, CAPPluginReturnPromise);
)
