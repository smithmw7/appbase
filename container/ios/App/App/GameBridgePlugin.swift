import Foundation
import Capacitor
import UIKit
import FirebaseAnalytics

/**
 * GameBridgePlugin
 *
 * Implements the NativeBridge contract used by the web content.
 * This version provides lightweight implementations so the app builds and runs;
 * native implementations can be expanded as needed.
 */
@objc(GameBridgePlugin)
public class GameBridgePlugin: CAPPlugin {

    // MARK: - App Info
    @objc func getAppInfo(_ call: CAPPluginCall) {
        // Execute on main thread to ensure UI context
        DispatchQueue.main.async {
            // Try multiple ways to get version
            var version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
            if version == nil || version == "$(MARKETING_VERSION)" {
                version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0.0.0"
            }
            if version == nil || version == "$(MARKETING_VERSION)" {
                version = "0.0.0"
            }
            
            // Try multiple ways to get build number
            var buildNumber = 0
            var buildString: String? = Bundle.main.infoDictionary?["CFBundleVersion"] as? String
            
            // If not found or still has variable, try alternative method
            if buildString == nil || buildString == "$(CURRENT_PROJECT_VERSION)" {
                buildString = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String
            }
            
            // Debug: Log what we're reading
            print("🔍 [GameBridge] CFBundleVersion from bundle: '\(buildString ?? "nil")'")
            print("🔍 [GameBridge] All bundle keys: \(Bundle.main.infoDictionary?.keys.sorted() ?? [])")
            
            if let build = buildString, build != "$(CURRENT_PROJECT_VERSION)" {
                buildNumber = Int(build) ?? 0
                print("✅ [GameBridge] Parsed build number: \(buildNumber)")
            } else {
                // Fallback: read directly from project settings if available
                // This shouldn't be necessary, but handle the case
                print("⚠️ [GameBridge] Build number not properly substituted, using fallback")
                buildNumber = 1
            }

            print("📱 [GameBridge] Returning app info - version: \(version ?? "unknown"), build: \(buildNumber)")
            call.resolve([
                "version": version ?? "0.0.0",
                "build": buildNumber
            ])
        }
    }

    // MARK: - Entitlements
    @objc func getEntitlements(_ call: CAPPluginCall) {
        // Stub: replace with real entitlement check (RevenueCat)
        let removeAds = UserDefaults.standard.bool(forKey: "removeAds")
        call.resolve(["removeAds": removeAds])
    }

    // MARK: - Ads
    @objc func showInterstitialAd(_ call: CAPPluginCall) {
        // Stub: integrate with AdMobPlugin to load/show ads
        let removeAds = UserDefaults.standard.bool(forKey: "removeAds")
        if removeAds {
            call.resolve(["shown": false])
            return
        }

        // Placeholder: no ad shown
        call.resolve(["shown": false])
    }

    // MARK: - Haptics
    @objc func haptic(_ call: CAPPluginCall) {
        guard let type = call.getString("type") else {
            call.reject("type is required")
            return
        }

        print("🔔 [GameBridge] Haptic called with type: \(type)")
        
        // Execute on main thread for immediate haptic feedback
        DispatchQueue.main.async {
            let generator: UIFeedbackGenerator
            
            switch type {
            case "light":
                generator = UIImpactFeedbackGenerator(style: .light)
            case "medium":
                generator = UIImpactFeedbackGenerator(style: .medium)
            case "heavy":
                generator = UIImpactFeedbackGenerator(style: .heavy)
            case "success":
                let notifGen = UINotificationFeedbackGenerator()
                notifGen.prepare()
                notifGen.notificationOccurred(.success)
                print("✅ [GameBridge] Success haptic triggered")
                call.resolve()
                return
            case "error":
                let notifGen = UINotificationFeedbackGenerator()
                notifGen.prepare()
                notifGen.notificationOccurred(.error)
                print("✅ [GameBridge] Error haptic triggered")
                call.resolve()
                return
            default:
                print("❌ [GameBridge] Invalid haptic type: \(type)")
                call.reject("invalid haptic type")
                return
            }
            
            // For impact generators, prepare and trigger
            generator.prepare()
            if let impactGen = generator as? UIImpactFeedbackGenerator {
                impactGen.impactOccurred()
                print("✅ [GameBridge] Impact haptic (\(type)) triggered")
            }
            call.resolve()
        }
    }

    // MARK: - Audio
    @objc func playSound(_ call: CAPPluginCall) {
        // Stub: implement AVAudioPlayer or system sounds as needed
        call.resolve()
    }

    // MARK: - Analytics
    @objc func analytics(_ call: CAPPluginCall) {
        guard let event = call.getString("event") else {
            call.reject("event is required")
            return
        }
        let params = call.getObject("params") ?? [:]
        Analytics.logEvent(event, parameters: params)
        call.resolve()
    }

    // MARK: - Debug (available in debug builds)
    #if DEBUG
    @objc func setGameState(_ call: CAPPluginCall) {
        // Stub: Hook into game state injection as needed
        call.resolve()
    }

    @objc func resetLocalData(_ call: CAPPluginCall) {
        if let bundleID = Bundle.main.bundleIdentifier {
            UserDefaults.standard.removePersistentDomain(forName: bundleID)
        }
        call.resolve()
    }

    @objc func forceContentRefresh(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.bridge?.webView?.reload()
        }
        call.resolve()
    }
    #endif
}
