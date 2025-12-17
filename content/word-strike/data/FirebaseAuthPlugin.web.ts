/**
 * Web implementation of FirebaseAuthPlugin (stub for web development)
 */
export class FirebaseAuthPluginWeb {
  private mockUserId: string | null = null;
  private mockEmail: string | null = null;

  async signInAnonymously(): Promise<{ userId: string }> {
    console.warn('[FirebaseAuth] Web stub - using mock anonymous user');
    this.mockUserId = `anon_${Date.now()}`;
    return { userId: this.mockUserId };
  }

  async getCurrentUserId(): Promise<{ userId: string | null }> {
    return { userId: this.mockUserId };
  }

  async signUpWithEmail(options: { email: string; password: string }): Promise<{ userId: string }> {
    console.warn('[FirebaseAuth] Web stub - mock sign up with email:', options.email);
    this.mockUserId = `user_${Date.now()}`;
    this.mockEmail = options.email;
    return { userId: this.mockUserId };
  }

  async signInWithEmail(options: { email: string; password: string }): Promise<{ userId: string }> {
    console.warn('[FirebaseAuth] Web stub - mock sign in with email:', options.email);
    this.mockUserId = `user_${Date.now()}`;
    this.mockEmail = options.email;
    return { userId: this.mockUserId };
  }

  async linkAnonymousToEmail(options: { email: string; password: string }): Promise<{ userId: string; linked: boolean }> {
    console.warn('[FirebaseAuth] Web stub - mock link anonymous to email:', options.email);
    this.mockEmail = options.email;
    return { userId: this.mockUserId || `user_${Date.now()}`, linked: true };
  }

  async sendSignInLink(options: { email: string }): Promise<{ success: boolean }> {
    console.warn('[FirebaseAuth] Web stub - mock send sign-in link to:', options.email);
    return { success: true };
  }

  async signInWithEmailLink(options: { email: string; link: string }): Promise<{ userId: string }> {
    console.warn('[FirebaseAuth] Web stub - mock sign in with email link');
    this.mockUserId = `emaillink_${Date.now()}`;
    this.mockEmail = options.email;
    return { userId: this.mockUserId };
  }

  async linkAnonymousToEmailLink(options: { email: string; link: string }): Promise<{ userId: string; linked: boolean }> {
    console.warn('[FirebaseAuth] Web stub - mock link anonymous to email link');
    this.mockEmail = options.email;
    return { userId: this.mockUserId || `emaillink_${Date.now()}`, linked: true };
  }

  async signInWithApple(_options: {}): Promise<{ userId: string }> {
    console.warn('[FirebaseAuth] Web stub - mock sign in with Apple');
    this.mockUserId = `apple_${Date.now()}`;
    this.mockEmail = 'apple.user@privaterelay.appleid.com';
    return { userId: this.mockUserId };
  }

  async linkAnonymousToApple(_options: {}): Promise<{ userId: string; linked: boolean }> {
    console.warn('[FirebaseAuth] Web stub - mock link anonymous to Apple');
    this.mockEmail = 'apple.user@privaterelay.appleid.com';
    return { userId: this.mockUserId || `apple_${Date.now()}`, linked: true };
  }

  async signOut(): Promise<{ success: boolean }> {
    console.warn('[FirebaseAuth] Web stub - mock sign out');
    this.mockUserId = null;
    this.mockEmail = null;
    return { success: true };
  }

  async getUserInfo(): Promise<{ userInfo: any | null }> {
    if (!this.mockUserId) {
      return { userInfo: null };
    }
    return {
      userInfo: {
        uid: this.mockUserId,
        email: this.mockEmail || '',
        isAnonymous: this.mockUserId.startsWith('anon_'),
        emailVerified: false,
        displayName: '',
        photoURL: ''
      }
    };
  }

  async sendPasswordReset(options: { email: string }): Promise<{ success: boolean }> {
    console.warn('[FirebaseAuth] Web stub - mock password reset for:', options.email);
    return { success: true };
  }

  async fetchSignInMethods(options: { email: string }): Promise<{ methods: string[] }> {
    console.warn('[FirebaseAuth] Web stub - mock fetch sign in methods for:', options.email);
    return { methods: [] };
  }

  async savePlayerData(): Promise<{ success: boolean }> {
    console.warn('[FirebaseAuth] Web stub - savePlayerData not implemented');
    return { success: true };
  }

  async loadPlayerData(): Promise<{ data: any | null }> {
    console.warn('[FirebaseAuth] Web stub - loadPlayerData not implemented');
    return { data: null };
  }

  async syncPlayerData(): Promise<{ data: any | null }> {
    console.warn('[FirebaseAuth] Web stub - syncPlayerData not implemented');
    return { data: null };
  }
}
