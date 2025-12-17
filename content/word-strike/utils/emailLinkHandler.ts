import { authManager } from '../data/AuthManager';

/**
 * Check if URL is a sign-in link and handle it
 */
export async function handleEmailLink(url: string): Promise<boolean> {
  try {
    // Check if this is a Firebase auth action link
    if (!url.includes('/__/auth/action')) {
      return false;
    }

    console.log('[EmailLinkHandler] Detected email link authentication');

    // Get email from localStorage
    const email = localStorage.getItem('emailForSignIn');
    if (!email) {
      console.warn('[EmailLinkHandler] No email found in storage - user may need to re-enter email');
      return false;
    }

    console.log('[EmailLinkHandler] Found stored email, completing authentication...');

    // Complete sign-in
    await authManager.signInWithEmailLink(email, url);
    console.log('[EmailLinkHandler] Email link authentication successful');
    
    return true;
  } catch (error) {
    console.error('[EmailLinkHandler] Failed to handle email link:', error);
    return false;
  }
}
