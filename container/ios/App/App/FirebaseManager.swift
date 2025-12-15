import Foundation
import FirebaseCore
import FirebaseAnalytics
import FirebaseRemoteConfig

/// Singleton manager for Firebase services (Analytics and Remote Config)
class FirebaseManager {
    static let shared = FirebaseManager()
    
    private var remoteConfig: RemoteConfig?
    private var isInitialized = false
    
    private init() {
        // Private initializer for singleton pattern
    }
    
    /// Initialize Firebase services
    func initialize() {
        guard !isInitialized else { return }
        
        // Firebase is configured via GoogleService-Info.plist
        // FirebaseApp.configure() is called automatically when the plist is present
        // But we can ensure it's configured explicitly
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
    ///   - parameters: Optional event parameters (dictionary of String keys to Any values). Defaults to empty dictionary.
    func logEvent(_ name: String, parameters: [String: Any]? = nil) {
        Analytics.logEvent(name, parameters: parameters)
    }
    
    /// Get a Remote Config value as String
    /// - Parameter key: Remote Config key
    /// - Returns: String value or empty string if not found
    func getRemoteConfigString(_ key: String) -> String {
        return remoteConfig?.configValue(forKey: key).stringValue ?? ""
    }
    
    /// Get a Remote Config value as Bool
    /// - Parameter key: Remote Config key
    /// - Returns: Bool value or false if not found
    func getRemoteConfigBool(_ key: String) -> Bool {
        return remoteConfig?.configValue(forKey: key).boolValue ?? false
    }
    
    /// Get a Remote Config value as Number
    /// - Parameter key: Remote Config key
    /// - Returns: NSNumber value or 0 if not found
    func getRemoteConfigNumber(_ key: String) -> NSNumber {
        return remoteConfig?.configValue(forKey: key).numberValue ?? 0
    }
}
