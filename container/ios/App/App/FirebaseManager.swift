import Foundation
import FirebaseCore
import FirebaseAnalytics
import FirebaseRemoteConfig

/// Singleton manager for Firebase services (Analytics and Remote Config)
@objc public class FirebaseManager: NSObject {
    @objc public static let shared = FirebaseManager()

    private var remoteConfig: RemoteConfig?
    private var isInitialized = false

    private override init() {
        super.init()
    }

    /// Initialize Firebase services
    @objc public func initialize() {
        guard !isInitialized else { return }

        // Configure Firebase if needed
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }

        // Initialize Remote Config
        remoteConfig = RemoteConfig.remoteConfig()

        // Set default values for Remote Config
        let defaults: [String: NSObject] = [
            "enable_ads": true as NSObject,
            "ad_unit_id": "" as NSString,
            "revenue_cat_api_key": "" as NSString,
            "remove_ads_product_id": "" as NSString,
            "app_version": "1.0.0" as NSString,
            "maintenance_mode": false as NSObject
        ]
        remoteConfig?.setDefaults(defaults)

        // Configure Remote Config settings
        let settings = RemoteConfigSettings()
        settings.minimumFetchInterval = 3600 // Fetch at most once per hour
        remoteConfig?.configSettings = settings

        // Fetch Remote Config values
        fetchRemoteConfig()

        isInitialized = true
    }

    /// Fetch Remote Config values from Firebase
    private func fetchRemoteConfig() {
        remoteConfig?.fetch { [weak self] (status, error) in
            if status == .success {
                self?.remoteConfig?.activate { (changed, error) in
                    if let error = error {
                        print("Firebase Remote Config activation error: \(error.localizedDescription)")
                    } else {
                        print("Firebase Remote Config activated successfully")
                    }
                }
            } else if let error = error {
                print("Firebase Remote Config fetch error: \(error.localizedDescription)")
            }
        }
    }

    /// Log an analytics event
    /// - Parameters:
    ///   - name: Event name
    ///   - parameters: Optional event parameters
    @objc public func logEvent(_ name: String, parameters: [String: Any]? = nil) {
        Analytics.logEvent(name, parameters: parameters)
    }

    /// Get a Remote Config value as String
    @objc public func getRemoteConfigString(_ key: String) -> String {
        return remoteConfig?.configValue(forKey: key).stringValue ?? ""
    }

    /// Get a Remote Config value as Bool
    @objc public func getRemoteConfigBool(_ key: String) -> Bool {
        return remoteConfig?.configValue(forKey: key).boolValue ?? false
    }

    /// Get a Remote Config value as Number
    @objc public func getRemoteConfigNumber(_ key: String) -> NSNumber {
        return remoteConfig?.configValue(forKey: key).numberValue ?? 0
    }
}
