import Foundation
import FirebaseCore
import FirebaseAnalytics
import FirebaseRemoteConfig
import FirebaseAuth
import FirebaseFirestore

/// Singleton manager for Firebase services (Analytics and Remote Config)
@objc public class FirebaseManager: NSObject {
    @objc public static let shared = FirebaseManager()

    private var remoteConfig: RemoteConfig?
    private var firestore: Firestore?
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
            "maintenance_mode": false as NSObject,
            "puzzle_data_url": "" as NSString,
            "puzzle_data_version": "" as NSString,
            "min_app_version": "1.0.0" as NSString
        ]
        remoteConfig?.setDefaults(defaults)

        // Configure Remote Config settings
        let remoteConfigSettings = RemoteConfigSettings()
        remoteConfigSettings.minimumFetchInterval = 3600 // Fetch at most once per hour
        remoteConfig?.configSettings = remoteConfigSettings

        // Fetch Remote Config values
        fetchRemoteConfig()

        // Initialize Firestore with offline persistence
        let db = Firestore.firestore()
        let firestoreSettings = FirestoreSettings()
        firestoreSettings.isPersistenceEnabled = true
        firestoreSettings.cacheSizeBytes = FirestoreCacheSizeUnlimited
        db.settings = firestoreSettings
        self.firestore = db

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

    // MARK: - Remote Config Puzzle Data

    /// Fetch Remote Config and call completion when done
    /// - Parameter completion: Callback with success boolean and error message
    @objc public func fetchRemoteConfigAsync(completion: @escaping (Bool, String?) -> Void) {
        remoteConfig?.fetch { [weak self] (status, error) in
            if status == .success {
                self?.remoteConfig?.activate { (changed, error) in
                    if let error = error {
                        completion(false, error.localizedDescription)
                    } else {
                        completion(true, nil)
                    }
                }
            } else if let error = error {
                completion(false, error.localizedDescription)
            } else {
                completion(false, "Unknown error fetching Remote Config")
            }
        }
    }

    /// Get puzzle data URL from Remote Config
    /// - Returns: URL string or nil if not configured
    @objc public func getPuzzleDataUrl() -> String? {
        guard let remoteConfig = remoteConfig else {
            return nil
        }
        let url = remoteConfig.configValue(forKey: "puzzle_data_url").stringValue
        return url.isEmpty == false ? url : nil
    }

    /// Get puzzle data version from Remote Config
    /// - Returns: Version string or nil if not configured
    @objc public func getPuzzleDataVersion() -> String? {
        guard let remoteConfig = remoteConfig else {
            return nil
        }
        let version = remoteConfig.configValue(forKey: "puzzle_data_version").stringValue
        return version.isEmpty == false ? version : nil
    }

    // MARK: - Authentication

    /// Sign in anonymously and return user ID
    /// - Parameter completion: Callback with user ID string or error message
    @objc public func signInAnonymously(completion: @escaping (String?, String?) -> Void) {
        Auth.auth().signInAnonymously { [weak self] authResult, error in
            if let error = error {
                completion(nil, error.localizedDescription)
                return
            }
            guard let user = authResult?.user else {
                completion(nil, "No user returned from anonymous sign-in")
                return
            }
            completion(user.uid, nil)
        }
    }

    /// Get current authenticated user ID
    /// - Returns: User ID string or nil if not authenticated
    @objc public func getCurrentUserId() -> String? {
        return Auth.auth().currentUser?.uid
    }

    // MARK: - Email/Password Authentication

    /// Sign up with email and password
    @objc public func signUpWithEmail(email: String, password: String, completion: @escaping (String?, String?) -> Void) {
        Auth.auth().createUser(withEmail: email, password: password) { authResult, error in
            if let error = error {
                completion(nil, error.localizedDescription)
                return
            }
            guard let user = authResult?.user else {
                completion(nil, "No user returned from sign up")
                return
            }
            completion(user.uid, nil)
        }
    }

    /// Sign in with email and password
    @objc public func signInWithEmail(email: String, password: String, completion: @escaping (String?, String?) -> Void) {
        Auth.auth().signIn(withEmail: email, password: password) { authResult, error in
            if let error = error {
                completion(nil, error.localizedDescription)
                return
            }
            guard let user = authResult?.user else {
                completion(nil, "No user returned from sign in")
                return
            }
            completion(user.uid, nil)
        }
    }

    /// Link anonymous account to email credential
    @objc public func linkAnonymousToEmail(email: String, password: String, completion: @escaping (String?, String?) -> Void) {
        guard let currentUser = Auth.auth().currentUser, currentUser.isAnonymous else {
            completion(nil, "No anonymous user to link")
            return
        }
        
        let credential = EmailAuthProvider.credential(withEmail: email, password: password)
        
        currentUser.link(with: credential) { authResult, error in
            if let error = error {
                completion(nil, error.localizedDescription)
                return
            }
            guard let user = authResult?.user else {
                completion(nil, "Failed to link account")
                return
            }
            completion(user.uid, nil)
        }
    }

    /// Sign out current user
    @objc public func signOut(completion: @escaping (Bool, String?) -> Void) {
        do {
            try Auth.auth().signOut()
            completion(true, nil)
        } catch let error {
            completion(false, error.localizedDescription)
        }
    }

    /// Get user info (email, provider, etc.)
    @objc public func getUserInfo() -> [String: Any]? {
        guard let user = Auth.auth().currentUser else {
            return nil
        }
        
        return [
            "uid": user.uid,
            "email": user.email ?? "",
            "isAnonymous": user.isAnonymous,
            "emailVerified": user.isEmailVerified,
            "displayName": user.displayName ?? "",
            "photoURL": user.photoURL?.absoluteString ?? ""
        ]
    }

    /// Send password reset email
    @objc public func sendPasswordReset(email: String, completion: @escaping (Bool, String?) -> Void) {
        Auth.auth().sendPasswordReset(withEmail: email) { error in
            if let error = error {
                completion(false, error.localizedDescription)
            } else {
                completion(true, nil)
            }
        }
    }

    /// Check if email is already registered
    @objc public func fetchSignInMethods(email: String, completion: @escaping ([String]?, String?) -> Void) {
        Auth.auth().fetchSignInMethods(forEmail: email) { methods, error in
            if let error = error {
                completion(nil, error.localizedDescription)
            } else {
                completion(methods ?? [], nil)
            }
        }
    }

    // MARK: - Firestore Player Data

    /// Convert data dictionary to Firestore-compatible format
    private func convertToFirestoreData(_ data: [String: Any]) -> [String: Any] {
        var firestoreData: [String: Any] = [:]
        
        for (key, value) in data {
            if let stringValue = value as? String {
                // Try to parse ISO timestamp strings to Firestore Timestamp
                if key.contains("At") || key.contains("Time") || key == "createdAt" || key == "lastSyncedAt" {
                    if let date = ISO8601DateFormatter().date(from: stringValue) {
                        firestoreData[key] = Timestamp(date: date)
                    } else {
                        firestoreData[key] = stringValue
                    }
                } else {
                    firestoreData[key] = stringValue
                }
            } else if let dictValue = value as? [String: Any] {
                firestoreData[key] = convertToFirestoreData(dictValue)
            } else if let arrayValue = value as? [Any] {
                firestoreData[key] = arrayValue.map { item -> Any in
                    if let dictItem = item as? [String: Any] {
                        return convertToFirestoreData(dictItem)
                    }
                    return item
                }
            } else {
                firestoreData[key] = value
            }
        }
        
        return firestoreData
    }

    /// Convert Firestore data to plain dictionary
    private func convertFromFirestoreData(_ data: [String: Any]) -> [String: Any] {
        var plainData: [String: Any] = [:]
        
        for (key, value) in data {
            if let timestamp = value as? Timestamp {
                // Convert Timestamp to ISO string
                let formatter = ISO8601DateFormatter()
                plainData[key] = formatter.string(from: timestamp.dateValue())
            } else if let dictValue = value as? [String: Any] {
                plainData[key] = convertFromFirestoreData(dictValue)
            } else if let arrayValue = value as? [Any] {
                plainData[key] = arrayValue.map { item -> Any in
                    if let dictItem = item as? [String: Any] {
                        return convertFromFirestoreData(dictItem)
                    }
                    if let timestampItem = item as? Timestamp {
                        let formatter = ISO8601DateFormatter()
                        return formatter.string(from: timestampItem.dateValue())
                    }
                    return item
                }
            } else {
                plainData[key] = value
            }
        }
        
        return plainData
    }

    /// Save player data to Firestore
    /// - Parameters:
    ///   - userId: Firebase user ID
    ///   - data: Player data dictionary
    ///   - completion: Callback with success boolean and error message
    @objc public func savePlayerData(userId: String, data: [String: Any], completion: @escaping (Bool, String?) -> Void) {
        guard let db = firestore else {
            completion(false, "Firestore not initialized")
            return
        }

        var firestoreData = convertToFirestoreData(data)
        firestoreData["lastSyncedAt"] = Timestamp()

        db.collection("players").document(userId).setData(firestoreData, merge: true) { error in
            if let error = error {
                completion(false, error.localizedDescription)
            } else {
                completion(true, nil)
            }
        }
    }

    /// Load player data from Firestore
    /// - Parameters:
    ///   - userId: Firebase user ID
    ///   - completion: Callback with data dictionary or error message
    @objc public func loadPlayerData(userId: String, completion: @escaping ([String: Any]?, String?) -> Void) {
        guard let db = firestore else {
            completion(nil, "Firestore not initialized")
            return
        }

        db.collection("players").document(userId).getDocument { document, error in
            if let error = error {
                completion(nil, error.localizedDescription)
                return
            }

            guard let document = document, document.exists else {
                // Document doesn't exist yet - return nil (not an error)
                completion(nil, nil)
                return
            }

            if let data = document.data() {
                // Convert Firestore data to plain dictionary
                let plainData = self.convertFromFirestoreData(data)
                completion(plainData, nil)
            } else {
                completion(nil, "Document exists but has no data")
            }
        }
    }

    /// Sync player data (merge local with remote)
    /// - Parameters:
    ///   - userId: Firebase user ID
    ///   - localData: Local player data dictionary
    ///   - completion: Callback with merged data dictionary or error message
    @objc public func syncPlayerData(userId: String, localData: [String: Any], completion: @escaping ([String: Any]?, String?) -> Void) {
        loadPlayerData(userId: userId) { remoteData, error in
            if let error = error {
                completion(nil, error)
                return
            }

            // If no remote data, use local data
            guard let remoteData = remoteData else {
                // Save local data to Firestore
                self.savePlayerData(userId: userId, data: localData) { success, saveError in
                    if success {
                        completion(localData, nil)
                    } else {
                        completion(localData, saveError) // Return local data even if save fails
                    }
                }
                return
            }

            // Merge local and remote data (prefer newer timestamps)
            var merged = remoteData

            // Compare lastSyncedAt timestamps (convert strings to dates if needed)
            let localLastSynced: Date? = {
                if let timestamp = localData["lastSyncedAt"] as? Timestamp {
                    return timestamp.dateValue()
                } else if let string = localData["lastSyncedAt"] as? String {
                    return ISO8601DateFormatter().date(from: string)
                }
                return nil
            }()
            let remoteLastSynced: Date? = {
                if let timestamp = remoteData["lastSyncedAt"] as? Timestamp {
                    return timestamp.dateValue()
                } else if let string = remoteData["lastSyncedAt"] as? String {
                    return ISO8601DateFormatter().date(from: string)
                }
                return nil
            }()

            // If local is newer or equal, merge local into remote
            if let local = localLastSynced, let remote = remoteLastSynced, local >= remote {
                // Merge stats (take maximums for streaks, sums for totals)
                if let localStats = localData["stats"] as? [String: Any],
                   let remoteStats = remoteData["stats"] as? [String: Any] {
                    var mergedStats = remoteStats
                    mergedStats["maxStreak"] = max(
                        (localStats["maxStreak"] as? Int ?? 0),
                        (remoteStats["maxStreak"] as? Int ?? 0)
                    )
                    mergedStats["totalPuzzlesCompleted"] = max(
                        (localStats["totalPuzzlesCompleted"] as? Int ?? 0),
                        (remoteStats["totalPuzzlesCompleted"] as? Int ?? 0)
                    )
                    mergedStats["totalPlayTime"] = max(
                        (localStats["totalPlayTime"] as? Int ?? 0),
                        (remoteStats["totalPlayTime"] as? Int ?? 0)
                    )
                    // Handle lastPlayedAt (could be Timestamp or ISO string)
                    if let localLastPlayed = localStats["lastPlayedAt"] {
                        let localDate: Date? = {
                            if let timestamp = localLastPlayed as? Timestamp {
                                return timestamp.dateValue()
                            } else if let string = localLastPlayed as? String {
                                return ISO8601DateFormatter().date(from: string)
                            }
                            return nil
                        }()
                        let remoteDate: Date? = {
                            if let remoteLastPlayed = remoteStats["lastPlayedAt"] {
                                if let timestamp = remoteLastPlayed as? Timestamp {
                                    return timestamp.dateValue()
                                } else if let string = remoteLastPlayed as? String {
                                    return ISO8601DateFormatter().date(from: string)
                                }
                            }
                            return nil
                        }()
                        if let local = localDate, let remote = remoteDate {
                            mergedStats["lastPlayedAt"] = local >= remote ? localLastPlayed : remoteStats["lastPlayedAt"]
                        } else if localDate != nil {
                            mergedStats["lastPlayedAt"] = localLastPlayed
                        } else if remoteStats["lastPlayedAt"] != nil {
                            mergedStats["lastPlayedAt"] = remoteStats["lastPlayedAt"]
                        }
                    } else if remoteStats["lastPlayedAt"] != nil {
                        mergedStats["lastPlayedAt"] = remoteStats["lastPlayedAt"]
                    }
                    merged["stats"] = mergedStats
                }

                // Merge puzzle progress (prefer local if newer)
                if let localProgress = localData["puzzleProgress"] as? [String: Any] {
                    var mergedProgress = remoteData["puzzleProgress"] as? [String: Any] ?? [:]
                    for (key, value) in localProgress {
                        if let localPuzzle = value as? [String: Any],
                           let remotePuzzle = mergedProgress[key] as? [String: Any] {
                            // Prefer local if it has newer completion or better time
                            let localCompletedDate: Date? = {
                                if let timestamp = localPuzzle["firstCompletedAt"] as? Timestamp {
                                    return timestamp.dateValue()
                                } else if let string = localPuzzle["firstCompletedAt"] as? String {
                                    return ISO8601DateFormatter().date(from: string)
                                }
                                return nil
                            }()
                            let remoteCompletedDate: Date? = {
                                if let timestamp = remotePuzzle["firstCompletedAt"] as? Timestamp {
                                    return timestamp.dateValue()
                                } else if let string = remotePuzzle["firstCompletedAt"] as? String {
                                    return ISO8601DateFormatter().date(from: string)
                                }
                                return nil
                            }()
                            
                            if let local = localCompletedDate, let remote = remoteCompletedDate, local >= remote {
                                mergedProgress[key] = localPuzzle
                            } else if localPuzzle["completed"] as? Bool == true && remotePuzzle["completed"] as? Bool != true {
                                mergedProgress[key] = localPuzzle
                            } else {
                                // Keep remote if it has better stats
                                var bestPuzzle = remotePuzzle
                                if let localBestTime = localPuzzle["bestTime"] as? Int,
                                   let remoteBestTime = remotePuzzle["bestTime"] as? Int,
                                   localBestTime < remoteBestTime {
                                    bestPuzzle["bestTime"] = localBestTime
                                }
                                if let localPerfect = localPuzzle["perfectCompletions"] as? Int,
                                   let remotePerfect = remotePuzzle["perfectCompletions"] as? Int {
                                    bestPuzzle["perfectCompletions"] = max(localPerfect, remotePerfect)
                                }
                                mergedProgress[key] = bestPuzzle
                            }
                        } else {
                            mergedProgress[key] = value
                        }
                    }
                    merged["puzzleProgress"] = mergedProgress
                }

                // Merge endless mode (take best streak)
                if let localEndless = localData["endlessMode"] as? [String: Any],
                   let remoteEndless = remoteData["endlessMode"] as? [String: Any] {
                    var mergedEndless = remoteEndless
                    mergedEndless["bestStreak"] = max(
                        (localEndless["bestStreak"] as? Int ?? 0),
                        (remoteEndless["bestStreak"] as? Int ?? 0)
                    )
                    merged["endlessMode"] = mergedEndless
                }
            }

            // Save merged data
            self.savePlayerData(userId: userId, data: merged) { success, saveError in
                if success {
                    completion(merged, nil)
                } else {
                    completion(merged, saveError) // Return merged data even if save fails
                }
            }
        }
    }
}
