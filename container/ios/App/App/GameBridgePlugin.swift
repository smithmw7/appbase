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
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
        let buildString = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
        let build = Int(buildString) ?? 0

        call.resolve([
            "version": version,
            "build": build
        ])
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

        let generator: UIFeedbackGenerator
        switch type {
        case "light":
            generator = UIImpactFeedbackGenerator(style: .light)
        case "medium":
            generator = UIImpactFeedbackGenerator(style: .medium)
        case "heavy":
            generator = UIImpactFeedbackGenerator(style: .heavy)
        case "success":
            let gen = UINotificationFeedbackGenerator()
            gen.notificationOccurred(.success)
            call.resolve()
            return
        case "error":
            let gen = UINotificationFeedbackGenerator()
            gen.notificationOccurred(.error)
            call.resolve()
            return
        default:
            call.reject("invalid haptic type")
            return
        }

        generator.prepare()
        if let impact = generator as? UIImpactFeedbackGenerator {
            impact.impactOccurred()
        }
        call.resolve()
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
