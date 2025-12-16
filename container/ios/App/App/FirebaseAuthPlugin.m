#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(FirebaseAuthPlugin, "FirebaseAuth",
           CAP_PLUGIN_METHOD(signInAnonymously, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getCurrentUserId, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(savePlayerData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(loadPlayerData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(syncPlayerData, CAPPluginReturnPromise);
)
