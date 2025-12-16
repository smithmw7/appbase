import Foundation
import Capacitor
import FirebaseAuth
import FirebaseFirestore

/**
 * FirebaseAuthPlugin
 * Exposes FirebaseManager authentication and Firestore methods to JavaScript
 */
@objc(FirebaseAuthPlugin)
public class FirebaseAuthPlugin: CAPPlugin {

    // MARK: - Authentication

    @objc func signInAnonymously(_ call: CAPPluginCall) {
        FirebaseManager.shared.signInAnonymously { userId, error in
            if let error = error {
                call.reject(error)
            } else if let userId = userId {
                call.resolve(["userId": userId])
            } else {
                call.reject("Failed to sign in anonymously")
            }
        }
    }

    @objc func getCurrentUserId(_ call: CAPPluginCall) {
        if let userId = FirebaseManager.shared.getCurrentUserId() {
            call.resolve(["userId": userId])
        } else {
            call.resolve(["userId": NSNull()])
        }
    }

    // MARK: - Firestore Player Data

    @objc func savePlayerData(_ call: CAPPluginCall) {
        guard let userId = call.getString("userId"),
              let data = call.getObject("data") else {
            call.reject("userId and data are required")
            return
        }

        FirebaseManager.shared.savePlayerData(userId: userId, data: data) { success, error in
            if let error = error {
                call.reject(error)
            } else {
                call.resolve(["success": success])
            }
        }
    }

    @objc func loadPlayerData(_ call: CAPPluginCall) {
        guard let userId = call.getString("userId") else {
            call.reject("userId is required")
            return
        }

        FirebaseManager.shared.loadPlayerData(userId: userId) { data, error in
            if let error = error {
                call.reject(error)
            } else {
                call.resolve(["data": data ?? NSNull()])
            }
        }
    }

    @objc func syncPlayerData(_ call: CAPPluginCall) {
        guard let userId = call.getString("userId"),
              let localData = call.getObject("localData") else {
            call.reject("userId and localData are required")
            return
        }

        FirebaseManager.shared.syncPlayerData(userId: userId, localData: localData) { mergedData, error in
            if let error = error {
                call.reject(error)
            } else {
                call.resolve(["data": mergedData ?? NSNull()])
            }
        }
    }
}
