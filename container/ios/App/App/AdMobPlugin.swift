import Foundation
import Capacitor
import GoogleMobileAds

/**
 * AdMobPlugin
 *
 * Minimal wrapper for interstitial ads.
 * This implementation is stubbed to compile and can be extended.
 */
@objc(AdMobPlugin)
public class AdMobPlugin: CAPPlugin {
    private var interstitial: InterstitialAd?
    private var adUnitId: String?

    // MARK: - Load Interstitial
    @objc func loadInterstitial(_ call: CAPPluginCall) {
        adUnitId = call.getString("adUnitId") ?? adUnitId
        guard let adUnitId = adUnitId else {
            call.reject("adUnitId is required")
            return
        }

        let request = Request()
        InterstitialAd.load(with: adUnitId, request: request) { [weak self] ad, error in
            if let error = error {
                call.reject("Failed to load interstitial: \(error.localizedDescription)")
                return
            }
            self?.interstitial = ad
            call.resolve()
        }
    }

    // MARK: - Show Interstitial
    @objc func showInterstitial(_ call: CAPPluginCall) {
        guard let interstitial = interstitial, let rootVC = bridge?.viewController else {
            call.resolve(["shown": false])
            return
        }
        interstitial.present(from: rootVC)
        self.interstitial = nil
        call.resolve(["shown": true])
    }

    // MARK: - Check Loaded
    @objc func isInterstitialLoaded(_ call: CAPPluginCall) {
        call.resolve(["loaded": interstitial != nil])
    }
}
