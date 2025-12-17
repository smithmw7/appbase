import Foundation
import AuthenticationServices
import CryptoKit

@objc public class AppleSignInManager: NSObject {
    @objc public static let shared = AppleSignInManager()
    
    private var currentNonce: String?
    private var completionHandler: ((String?, String?, String?) -> Void)?
    
    /// Start Apple Sign In flow
    @objc public func signIn(completion: @escaping (String?, String?, String?) -> Void) {
        self.completionHandler = completion
        
        // Generate nonce for security
        let nonce = randomNonceString()
        currentNonce = nonce
        
        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = [.email, .fullName]
        request.nonce = sha256(nonce)
        
        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
    }
    
    // MARK: - Helper Methods
    
    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remainingLength = length
        
        while remainingLength > 0 {
            let randoms: [UInt8] = (0 ..< 16).map { _ in
                var random: UInt8 = 0
                let errorCode = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
                if errorCode != errSecSuccess {
                    fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(errorCode)")
                }
                return random
            }
            
            randoms.forEach { random in
                if remainingLength == 0 {
                    return
                }
                
                if random < charset.count {
                    result.append(charset[Int(random)])
                    remainingLength -= 1
                }
            }
        }
        
        return result
    }
    
    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        let hashString = hashedData.compactMap {
            String(format: "%02x", $0)
        }.joined()
        
        return hashString
    }
}

// MARK: - ASAuthorizationControllerDelegate

extension AppleSignInManager: ASAuthorizationControllerDelegate {
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            completionHandler?(nil, nil, "Invalid credential type")
            return
        }
        
        guard let nonce = currentNonce else {
            completionHandler?(nil, nil, "Invalid state: nonce is missing")
            return
        }
        
        guard let appleIDToken = appleIDCredential.identityToken,
              let idTokenString = String(data: appleIDToken, encoding: .utf8) else {
            completionHandler?(nil, nil, "Unable to fetch identity token")
            return
        }
        
        // Success - return idToken and nonce
        completionHandler?(idTokenString, nonce, nil)
        completionHandler = nil
        currentNonce = nil
    }
    
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let errorMessage = (error as NSError).localizedDescription
        completionHandler?(nil, nil, errorMessage)
        completionHandler = nil
        currentNonce = nil
    }
}

// MARK: - ASAuthorizationControllerPresentationContextProviding

extension AppleSignInManager: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return UIApplication.shared.windows.first { $0.isKeyWindow }!
    }
}
