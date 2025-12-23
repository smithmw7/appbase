/**
 * AuthManager
 * Manages authentication state, account linking, and user profiles
 */

import { registerPlugin } from '@capacitor/core';
import { playerDataManager } from './PlayerDataManager';
import { firebaseSyncManager } from './FirebaseSyncManager';

export interface UserProfile {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
}

interface FirebaseAuthPlugin {
  signInAnonymously(): Promise<{ userId: string }>;
  getCurrentUserId(): Promise<{ userId: string | null }>;
  signUpWithEmail(options: { email: string; password: string }): Promise<{ userId: string }>;
  signInWithEmail(options: { email: string; password: string }): Promise<{ userId: string }>;
  linkAnonymousToEmail(options: { email: string; password: string }): Promise<{ userId: string; linked: boolean }>;
  sendSignInLink(options: { email: string }): Promise<{ success: boolean }>;
  signInWithEmailLink(options: { email: string; link: string }): Promise<{ userId: string }>;
  linkAnonymousToEmailLink(options: { email: string; link: string }): Promise<{ userId: string; linked: boolean }>;
  signOut(): Promise<{ success: boolean }>;
  getUserInfo(): Promise<{ userInfo: any | null }>;
  sendPasswordReset(options: { email: string }): Promise<{ success: boolean }>;
  fetchSignInMethods(options: { email: string }): Promise<{ methods: string[] }>;
  signInWithApple(options: { idToken: string; nonce: string }): Promise<{ userId: string }>;
  linkAnonymousToApple(options: { idToken: string; nonce: string }): Promise<{ userId: string; linked: boolean }>;
  linkAccountToApple(options: { idToken: string; nonce: string }): Promise<{ userId: string; linked: boolean }>;
}

const FirebaseAuth = registerPlugin<FirebaseAuthPlugin>('FirebaseAuth', {
  web: () => import('./FirebaseAuthPlugin.web').then(m => new m.FirebaseAuthPluginWeb()),
});

class AuthManager {
  private currentUser: UserProfile | null = null;
  private listeners: Set<(user: UserProfile | null) => void> = new Set();

  /**
   * Initialize authentication
   * Returns current user or creates anonymous user
   */
  async initialize(): Promise<UserProfile | null> {
    try {
      // Check if already authenticated
      const result = await FirebaseAuth.getCurrentUserId();
      if (result.userId) {
        await this.loadUserInfo();
        return this.currentUser;
      }

      // Create anonymous user
      const authResult = await FirebaseAuth.signInAnonymously();
      await this.loadUserInfo();
      console.log('[AuthManager] Initialized with anonymous user:', authResult.userId);
      return this.currentUser;
    } catch (error) {
      console.error('[AuthManager] Failed to initialize:', error);
      return null;
    }
  }

  /**
   * Load user info from Firebase
   */
  private async loadUserInfo(): Promise<void> {
    try {
      const result = await FirebaseAuth.getUserInfo();
      if (result.userInfo) {
        this.currentUser = {
          uid: result.userInfo.uid,
          email: result.userInfo.email || null,
          isAnonymous: result.userInfo.isAnonymous,
          emailVerified: result.userInfo.emailVerified,
          displayName: result.userInfo.displayName || null,
          photoURL: result.userInfo.photoURL || null,
        };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('[AuthManager] Failed to load user info:', error);
    }
  }

  /**
   * Sign up with email and password
   * If user is anonymous, automatically link the account
   */
  async signUpWithEmail(email: string, password: string): Promise<void> {
    try {
      if (this.currentUser?.isAnonymous) {
        // Link anonymous account instead of creating new one
        console.log('[AuthManager] Linking anonymous account to email:', email);
        const result = await FirebaseAuth.linkAnonymousToEmail({ email, password });
        console.log('[AuthManager] Account linked successfully:', result.userId);
        
        // Reload user info
        await this.loadUserInfo();
        
        // Trigger Firebase sync for the linked account
        if (this.currentUser && !this.currentUser.isAnonymous) {
          await firebaseSyncManager.performInitialSync();
          console.log('[AuthManager] Firebase sync completed after linking');
        }
      } else {
        // Normal sign up
        console.log('[AuthManager] Creating new account with email:', email);
        const result = await FirebaseAuth.signUpWithEmail({ email, password });
        console.log('[AuthManager] Account created:', result.userId);
        
        // Reload user info
        await this.loadUserInfo();
        
        // Initialize player data for new account
        if (this.currentUser) {
          await playerDataManager.initialize(this.currentUser.uid);
          await firebaseSyncManager.performInitialSync();
        }
      }
    } catch (error: any) {
      console.error('[AuthManager] Sign up failed:', error);
      throw this.formatError(error);
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<void> {
    try {
      console.log('[AuthManager] Signing in with email:', email);
      const result = await FirebaseAuth.signInWithEmail({ email, password });
      console.log('[AuthManager] Signed in successfully:', result.userId);
      
      // Reload user info
      await this.loadUserInfo();
      
      // Initialize player data and sync
      if (this.currentUser) {
        await playerDataManager.initialize(this.currentUser.uid);
        await firebaseSyncManager.performInitialSync();
        firebaseSyncManager.startPeriodicSync();
      }
    } catch (error: any) {
      console.error('[AuthManager] Sign in failed:', error);
      throw this.formatError(error);
    }
  }

  /**
   * Sign out current user
   * Clears auth state but keeps local data
   */
  async signOut(): Promise<void> {
    try {
      console.log('[AuthManager] Signing out');
      await FirebaseAuth.signOut();
      
      // Stop Firebase sync
      firebaseSyncManager.stopPeriodicSync();
      
      // Clear current user
      this.currentUser = null;
      this.notifyListeners();
      
      // End current session
      await playerDataManager.endSession();
      
      console.log('[AuthManager] Signed out successfully');
    } catch (error) {
      console.error('[AuthManager] Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Send one-time sign-in link to email
   */
  async sendSignInLink(email: string): Promise<void> {
    try {
      console.log('[AuthManager] Sending sign-in link to:', email);
      await FirebaseAuth.sendSignInLink({ email });
      
      // Store email in localStorage for link verification
      localStorage.setItem('emailForSignIn', email);
      
      console.log('[AuthManager] Sign-in link sent successfully');
    } catch (error: any) {
      console.error('[AuthManager] Failed to send sign-in link:', error);
      throw this.formatError(error);
    }
  }

  /**
   * Complete sign-in with email link
   * If user is anonymous, automatically link the account
   */
  async signInWithEmailLink(email: string, link: string): Promise<void> {
    try {
      if (this.currentUser?.isAnonymous) {
        // Link anonymous account
        console.log('[AuthManager] Linking anonymous account to email via link');
        const result = await FirebaseAuth.linkAnonymousToEmailLink({ email, link });
        console.log('[AuthManager] Account linked via email link:', result.userId);
        
        await this.loadUserInfo();
        
        if (this.currentUser && !this.currentUser.isAnonymous) {
          await firebaseSyncManager.performInitialSync();
          console.log('[AuthManager] Firebase sync completed after linking');
        }
      } else {
        // Normal sign in
        console.log('[AuthManager] Signing in with email link');
        const result = await FirebaseAuth.signInWithEmailLink({ email, link });
        console.log('[AuthManager] Signed in via email link:', result.userId);
        
        await this.loadUserInfo();
        
        if (this.currentUser) {
          await playerDataManager.initialize(this.currentUser.uid);
          await firebaseSyncManager.performInitialSync();
          firebaseSyncManager.startPeriodicSync();
        }
      }
      
      // Clear stored email
      localStorage.removeItem('emailForSignIn');
    } catch (error: any) {
      console.error('[AuthManager] Email link sign-in failed:', error);
      throw this.formatError(error);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      console.log('[AuthManager] Sending password reset email to:', email);
      await FirebaseAuth.sendPasswordReset({ email });
      console.log('[AuthManager] Password reset email sent');
    } catch (error: any) {
      console.error('[AuthManager] Password reset failed:', error);
      throw this.formatError(error);
    }
  }

  /**
   * Sign in with Apple
   * If user is anonymous, automatically link the account
   * If credential is already in use, sign in with that account instead
   */
  async signInWithApple(idToken: string, nonce: string): Promise<void> {
    try {
      if (this.currentUser?.isAnonymous) {
        // Link anonymous account
        console.log('[AuthManager] Linking anonymous account to Apple');
        const result = await FirebaseAuth.linkAnonymousToApple({ idToken, nonce });
        console.log('[AuthManager] Account linked to Apple:', result.userId);
        
        await this.loadUserInfo();
        
        if (this.currentUser && !this.currentUser.isAnonymous) {
          await firebaseSyncManager.performInitialSync();
          console.log('[AuthManager] Firebase sync completed after Apple linking');
        }
      } else {
        // New sign in with Apple
        console.log('[AuthManager] Signing in with Apple');
        const result = await FirebaseAuth.signInWithApple({ idToken, nonce });
        console.log('[AuthManager] Signed in with Apple:', result.userId);
        
        await this.loadUserInfo();
        
        if (this.currentUser) {
          await playerDataManager.initialize(this.currentUser.uid);
          await firebaseSyncManager.performInitialSync();
          firebaseSyncManager.startPeriodicSync();
        }
      }
    } catch (error: any) {
      console.error('[AuthManager] Apple sign in failed:', error);
      
      // Handle credential already in use - sign in with that account instead
      const errorCode = error.code || error.message || '';
      if (errorCode.includes('credential-already-in-use') || errorCode.includes('17025')) {
        console.log('[AuthManager] Credential already in use, signing in with existing account');
        try {
          const result = await FirebaseAuth.signInWithApple({ idToken, nonce });
          console.log('[AuthManager] Signed in with existing Apple account:', result.userId);
          
          await this.loadUserInfo();
          
          if (this.currentUser) {
            await playerDataManager.initialize(this.currentUser.uid);
            await firebaseSyncManager.performInitialSync();
            firebaseSyncManager.startPeriodicSync();
          }
        } catch (signInError: any) {
          console.error('[AuthManager] Failed to sign in with existing account:', signInError);
          throw this.formatError(signInError);
        }
      } else {
        throw this.formatError(error);
      }
    }
  }

  /**
   * Link Apple credential to existing authenticated account (not anonymous)
   */
  async linkAccountToApple(idToken: string, nonce: string): Promise<void> {
    try {
      if (!this.currentUser || this.currentUser.isAnonymous) {
        throw new Error('Cannot link Apple to anonymous account. Use signInWithApple instead.');
      }
      
      console.log('[AuthManager] Linking Apple to existing account');
      const result = await FirebaseAuth.linkAccountToApple({ idToken, nonce });
      console.log('[AuthManager] Apple linked successfully:', result.userId);
      
      await this.loadUserInfo();
    } catch (error: any) {
      console.error('[AuthManager] Failed to link Apple account:', error);
      throw this.formatError(error);
    }
  }

  /**
   * Check if email is already registered
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const result = await FirebaseAuth.fetchSignInMethods({ email });
      return result.methods.length > 0;
    } catch (error) {
      console.error('[AuthManager] Failed to check email:', error);
      return false;
    }
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Check if user is anonymous
   */
  isAnonymous(): boolean {
    return this.currentUser?.isAnonymous ?? true;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error('[AuthManager] Listener error:', error);
      }
    });
  }

  /**
   * Format Firebase error messages for user display
   */
  private formatError(error: any): Error {
    const errorCode = error.code || error.message || '';
    
    const ERROR_MESSAGES: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Please enter a valid email address',
      'auth/weak-password': 'Password should be at least 8 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Check your connection',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/credential-already-in-use': 'This Apple account is already linked. Signing you in...',
      'auth/provider-already-linked': 'This Apple account is already linked',
      'Sign in cancelled': 'Sign in cancelled',
    };

    const message = ERROR_MESSAGES[errorCode] || error.message || 'Authentication failed';
    const formattedError = new Error(message);
    (formattedError as any).code = errorCode;
    return formattedError;
  }
}

// Export singleton instance
export const authManager = new AuthManager();
