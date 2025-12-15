#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Objective-C bridge for LocalStoragePlugin
CAP_PLUGIN(LocalStoragePlugin, "LocalStorage",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getPuzzle, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(savePuzzle, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getPlayerStats, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(updatePlayerStats, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getSettings, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(updateSettings, CAPPluginReturnPromise);
)
