import { Capacitor } from '@capacitor/core';
import { SignInWithApple, type SignInWithAppleResponse } from '@capacitor-community/apple-sign-in';
import { nanoid } from 'nanoid';

export interface AppleSignInResult extends SignInWithAppleResponse {
  nonce: string; // Raw (unhashed) nonce for Firebase
}

/**
 * Compute SHA256 hash of a string (for nonce hashing per Firebase best practices)
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Perform Apple Sign In following Firebase best practices:
 * 1. Generate raw (unhashed) nonce
 * 2. SHA256 hash the nonce
 * 3. Send hashed nonce to Apple (via Capacitor plugin)
 * 4. Return raw nonce for Firebase credential creation
 * 
 * This follows Firebase's official guidance:
 * https://firebase.google.com/docs/auth/ios/apple
 */
export async function performAppleSignIn(): Promise<AppleSignInResult> {
  // On web or non-native platforms, just throw a clear error instead of trying
  // to call the native plugin.
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Apple Sign In is only available on a native device.');
  }

  // Step 1: Generate raw (unhashed) nonce
  const rawNonce = nanoid(32);
  const state = nanoid(16);

  // Step 2: Hash the nonce (Firebase best practice - send hashed to Apple)
  const hashedNonce = await sha256(rawNonce);

  // Step 3: Send hashed nonce to Apple via Capacitor plugin
  const response = await SignInWithApple.authorize({
    clientId: 'com.hightopgames.word',
    redirectURI: 'com.hightopgames.word://auth',
    scopes: 'email name',
    state,
    nonce: hashedNonce, // Send hashed nonce to Apple
  });

  // Step 4: Return response with raw nonce (for Firebase credential)
  return {
    ...response,
    nonce: rawNonce, // Return raw nonce for Firebase's rawNonce parameter
  };
}
