import Foundation
import Capacitor

/**
 * RemoteConfigPlugin
 * Exposes Firebase Remote Config to JavaScript
 */
@objc(RemoteConfigPlugin)
public class RemoteConfigPlugin: CAPPlugin {

    // MARK: - Remote Config Methods

    @objc func fetchRemoteConfig(_ call: CAPPluginCall) {
        FirebaseManager.shared.fetchRemoteConfigAsync { success, error in
            if let error = error {
                call.reject(error)
            } else {
                call.resolve(["success": success])
            }
        }
    }

    @objc func getPuzzleDataUrl(_ call: CAPPluginCall) {
        if let url = FirebaseManager.shared.getPuzzleDataUrl() {
            call.resolve(["url": url])
        } else {
            call.resolve(["url": NSNull()])
        }
    }

    @objc func getRemoteConfigValue(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("key parameter is required")
            return
        }

        let value = FirebaseManager.shared.getRemoteConfigString(key)
        if value.isEmpty {
            call.resolve(["value": NSNull()])
        } else {
            call.resolve(["value": value])
        }
    }
}
