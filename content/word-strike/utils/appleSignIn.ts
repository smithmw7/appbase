import { Capacitor } from '@capacitor/core';
import { SignInWithApple, type SignInWithAppleResponse } from '@capacitor-community/apple-sign-in';
import { nanoid } from 'nanoid';

export interface AppleSignInResult extends SignInWithAppleResponse {}

/**
 * Perform Apple Sign In using the same plugin we verified in apple-signin-test.
 * This is intentionally UI-agnostic so the modal can just call it and handle
 * success/error states.
 */
export async function performAppleSignIn(): Promise<AppleSignInResult> {
  // On web or non-native platforms, just throw a clear error instead of trying
  // to call the native plugin.
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Apple Sign In is only available on a native device.');
  }

  const nonce = nanoid(32);
  const state = nanoid(16);

  // These values mirror the working test app configuration.
  return await SignInWithApple.authorize({
    clientId: 'com.hightopgames.word',
    redirectURI: 'com.hightopgames.word://auth',
    scopes: 'email name',
    state,
    nonce,
  });
}
