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

    // MARK: - Email/Password Authentication

    @objc func signUpWithEmail(_ call: CAPPluginCall) {
        guard let email = call.getString("email"),
              let password = call.getString("password") else {
            call.reject("email and password are required")
            return
        }
        
        FirebaseManager.shared.signUpWithEmail(email: email, password: password) { userId, error in
            if let error = error {
                call.reject(error)
            } else if let userId = userId {
                call.resolve(["userId": userId])
            } else {
                call.reject("Failed to sign up")
            }
        }
    }

    @objc func signInWithEmail(_ call: CAPPluginCall) {
        guard let email = call.getString("email"),
              let password = call.getString("password") else {
            call.reject("email and password are required")
            return
        }
        
        FirebaseManager.shared.signInWithEmail(email: email, password: password) { userId, error in
            if let error = error {
                call.reject(error)
            } else if let userId = userId {
                call.resolve(["userId": userId])
            } else {
                call.reject("Failed to sign in")
            }
        }
    }

    @objc func linkAnonymousToEmail(_ call: CAPPluginCall) {
        guard let email = call.getString("email"),
              let password = call.getString("password") else {
            call.reject("email and password are required")
            return
        }
        
        FirebaseManager.shared.linkAnonymousToEmail(email: email, password: password) { userId, error in
            if let error = error {
                call.reject(error)
            } else if let userId = userId {
                call.resolve(["userId": userId, "linked": true])
            } else {
                call.reject("Failed to link account")
            }
        }
    }

    @objc func signOut(_ call: CAPPluginCall) {
        FirebaseManager.shared.signOut { success, error in
            if let error = error {
                call.reject(error)
            } else {
                call.resolve(["success": success])
            }
        }
    }

    @objc func getUserInfo(_ call: CAPPluginCall) {
        if let userInfo = FirebaseManager.shared.getUserInfo() {
            call.resolve(["userInfo": userInfo])
        } else {
            call.resolve(["userInfo": NSNull()])
        }
    }

    @objc func sendPasswordReset(_ call: CAPPluginCall) {
        guard let email = call.getString("email") else {
            call.reject("email is required")
            return
        }
        
        FirebaseManager.shared.sendPasswordReset(email: email) { success, error in
            if let error = error {
                call.reject(error)
            } else {
                call.resolve(["success": success])
            }
        }
    }

    @objc func fetchSignInMethods(_ call: CAPPluginCall) {
        guard let email = call.getString("email") else {
            call.reject("email is required")
            return
        }
        
        FirebaseManager.shared.fetchSignInMethods(email: email) { methods, error in
            if let error = error {
                call.reject(error)
            } else {
                call.resolve(["methods": methods ?? []])
            }
        }
    }

    // MARK: - Email Link Authentication

    @objc func sendSignInLink(_ call: CAPPluginCall) {
        guard let email = call.getString("email") else {
            call.reject("email is required")
            return
        }
        
        FirebaseManager.shared.sendSignInLink(email: email) { success, error in
            if let error = error {
                call.reject(error)
            } else {
                call.resolve(["success": success])
            }
        }
    }

    @objc func signInWithEmailLink(_ call: CAPPluginCall) {
        guard let email = call.getString("email"),
              let link = call.getString("link") else {
            call.reject("email and link are required")
            return
        }
        
        FirebaseManager.shared.signInWithEmailLink(email: email, link: link) { userId, error in
            if let error = error {
                call.reject(error)
            } else if let userId = userId {
                call.resolve(["userId": userId])
            } else {
                call.reject("Failed to sign in with email link")
            }
        }
    }

    @objc func linkAnonymousToEmailLink(_ call: CAPPluginCall) {
        guard let email = call.getString("email"),
              let link = call.getString("link") else {
            call.reject("email and link are required")
            return
        }
        
        FirebaseManager.shared.linkAnonymousToEmailLink(email: email, link: link) { userId, error in
            if let error = error {
                call.reject(error)
            } else if let userId = userId {
                call.resolve(["userId": userId, "linked": true])
            } else {
                call.reject("Failed to link account")
            }
        }
    }

    // MARK: - Apple Sign In

    @objc func signInWithApple(_ call: CAPPluginCall) {
        AppleSignInManager.shared.signIn { idToken, nonce, error in
            if let error = error {
                call.reject(error)
                return
            }
            
            guard let idToken = idToken, let nonce = nonce else {
                call.reject("Failed to get Apple credentials")
                return
            }
            
            FirebaseManager.shared.signInWithApple(idToken: idToken, nonce: nonce) { userId, error in
                if let error = error {
                    call.reject(error)
                } else if let userId = userId {
                    call.resolve(["userId": userId])
                } else {
                    call.reject("Failed to sign in with Apple")
                }
            }
        }
    }

    @objc func linkAnonymousToApple(_ call: CAPPluginCall) {
        AppleSignInManager.shared.signIn { idToken, nonce, error in
            if let error = error {
                call.reject(error)
                return
            }
            
            guard let idToken = idToken, let nonce = nonce else {
                call.reject("Failed to get Apple credentials")
                return
            }
            
            FirebaseManager.shared.linkAnonymousToApple(idToken: idToken, nonce: nonce) { userId, error in
                if let error = error {
                    call.reject(error)
                } else if let userId = userId {
                    call.resolve(["userId": userId, "linked": true])
                } else {
                    call.reject("Failed to link Apple account")
                }
            }
        }
    }
}
