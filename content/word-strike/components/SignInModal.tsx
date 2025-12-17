import React, { useState } from 'react';
import { authManager } from '../data/AuthManager';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAnonymous: boolean;
  userEmail: string | null;
}

type AuthStep = 'email' | 'create' | 'login' | 'emailSent' | 'profile';

export const SignInModal: React.FC<SignInModalProps> = ({ 
  isOpen, 
  onClose, 
  isAnonymous, 
  userEmail 
}) => {
  const [step, setStep] = useState<AuthStep>(isAnonymous ? 'email' : 'profile');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(isAnonymous ? 'email' : 'profile');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setEmailLinkSent(false);
    onClose();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Step 1: Email input and provider selection
  const handleEmailContinue = async () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if email exists
      const exists = await authManager.checkEmailExists(email);
      
      if (exists) {
        setStep('login'); // Existing user
      } else {
        setStep('create'); // New user
      }
    } catch (error: any) {
      setError('Unable to verify email. Please try again.');
      console.error('[SignInModal] Email check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apple Sign In
  const handleAppleSignIn = async () => {
    setError('');
    setAppleLoading(true);
    
    try {
      await authManager.signInWithApple();
      console.log('[SignInModal] Apple sign in successful');
      handleClose();
    } catch (error: any) {
      console.error('[SignInModal] Apple sign in error:', error);
      
      // Don't show error if user cancelled
      if (error.message !== 'Sign in cancelled') {
        setError(error.message || 'Apple sign in failed');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  // Google placeholder (no-op)
  const handleGoogleSignIn = () => {
    // Placeholder - no functionality
    console.log('[SignInModal] Google sign-in placeholder clicked');
  };

  // Create account (Step 2 for new users)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authManager.signUpWithEmail(email, password);
      console.log('[SignInModal] Account created successfully');
      handleClose();
    } catch (error: any) {
      console.error('[SignInModal] Create account error:', error);
      setError(error.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  // Login (Step 2 for existing users)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      await authManager.signInWithEmail(email, password);
      console.log('[SignInModal] Logged in successfully');
      handleClose();
    } catch (error: any) {
      console.error('[SignInModal] Login error:', error);
      setError(error.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  // Send one-time code via email link
  const handleEmailCode = async () => {
    setError('');
    setLoading(true);

    try {
      await authManager.sendSignInLink(email);
      console.log('[SignInModal] One-time code sent successfully');
      setEmailLinkSent(true);
      setStep('emailSent');
    } catch (error: any) {
      console.error('[SignInModal] Send email link error:', error);
      setError(error.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    setError('');
    setLoading(true);

    try {
      await authManager.resetPassword(email);
      console.log('[SignInModal] Password reset email sent');
      setEmailLinkSent(false);
      setStep('emailSent');
    } catch (error: any) {
      console.error('[SignInModal] Password reset error:', error);
      setError(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authManager.signOut();
      console.log('[SignInModal] Signed out successfully');
      handleClose();
    } catch (error: any) {
      console.error('[SignInModal] Sign out error:', error);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden"
        style={{
          marginTop: 'calc(env(safe-area-inset-top) + 16px)',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 16px)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 bg-white border-b border-slate-200"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}
        >
          <div className="px-6 pb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              {step === 'email' && 'Log in or create an account'}
              {step === 'create' && 'Create your free account'}
              {step === 'login' && 'Welcome back'}
              {step === 'emailSent' && 'Check your email'}
              {step === 'profile' && 'Profile'}
            </h2>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <span className="text-slate-600 text-2xl leading-none">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pb-8 overflow-y-auto">
          {/* Profile View (Authenticated) */}
          {step === 'profile' && !isAnonymous && (
            <div>
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    {userEmail?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{userEmail}</p>
                    <p className="text-sm text-slate-500">Signed in</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-3 px-4 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 disabled:bg-slate-300 transition-colors"
              >
                {loading ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          )}

          {/* Step 1: Email Entry + Provider Buttons */}
          {step === 'email' && (
            <div>
              {/* Apple Sign In Button */}
              <button
                onClick={handleAppleSignIn}
                disabled={appleLoading || loading}
                className="w-full py-3 px-4 bg-black text-white font-medium rounded-xl hover:bg-gray-900 disabled:bg-slate-300 transition-colors flex items-center justify-center space-x-2 mb-3"
              >
                {appleLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <span>Continue with Apple</span>
                  </>
                )}
              </button>

              {/* Google Placeholder Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading || appleLoading}
                className="w-full py-3 px-4 bg-white text-slate-800 font-medium rounded-xl border-2 border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 transition-colors flex items-center justify-center space-x-2 mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">or</span>
                </div>
              </div>

              {/* Email Input */}
              <form onSubmit={(e) => { e.preventDefault(); handleEmailContinue(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-base"
                      placeholder=""
                      required
                      disabled={loading || appleLoading}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || appleLoading || !email}
                    className="w-full py-3 px-4 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 disabled:bg-slate-300 transition-colors"
                  >
                    {loading ? 'Checking...' : 'Continue'}
                  </button>
                </div>
              </form>

              <p className="mt-4 text-xs text-slate-500 text-center">
                By continuing, you agree to the{' '}
                <a href="#" className="underline">Terms of Sale</a>,{' '}
                <a href="#" className="underline">Terms of Service</a>, and{' '}
                <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </div>
          )}

          {/* Step 2: Create Account (New User) */}
          {step === 'create' && (
            <div>
              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-1">Email address</p>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-800">{email}</span>
                  <button
                    onClick={() => setStep('email')}
                    className="text-sm text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateAccount}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-base"
                      placeholder="At least 8 characters"
                      required
                      disabled={loading}
                      minLength={8}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-base"
                      placeholder="Confirm your password"
                      required
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 disabled:bg-slate-300 transition-colors"
                  >
                    {loading ? 'Creating Account...' : 'Create account'}
                  </button>
                </div>
              </form>

              <p className="mt-4 text-xs text-slate-500 text-center">
                By creating an account, you agree to the{' '}
                <a href="#" className="underline">Terms of Sale</a>,{' '}
                <a href="#" className="underline">Terms of Service</a>, and{' '}
                <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </div>
          )}

          {/* Step 2: Log In (Existing User) */}
          {step === 'login' && (
            <div>
              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-1">Email address</p>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-800">{email}</span>
                  <button
                    onClick={() => setStep('email')}
                    className="text-sm text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Enter your password to log in.
              </p>

              <form onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-base"
                      placeholder=""
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-sm text-slate-600 hover:text-slate-800 underline"
                  >
                    Forgot your password?
                  </button>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 disabled:bg-slate-300 transition-colors"
                  >
                    {loading ? 'Signing In...' : 'Log in'}
                  </button>

                  <button
                    type="button"
                    onClick={handleEmailCode}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-white text-slate-800 font-medium rounded-xl border-2 border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 transition-colors"
                  >
                    Email me a one-time code
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Email Sent Confirmation */}
          {step === 'emailSent' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <p className="text-slate-800 font-medium mb-2">Check your email</p>
              <p className="text-sm text-slate-600 mb-6">
                We've sent {emailLinkSent ? 'a sign-in link' : 'a password reset link'} to{' '}
                <span className="font-medium">{email}</span>. Click the link to continue.
              </p>

              <button
                onClick={() => setStep('email')}
                className="text-slate-600 hover:text-slate-800 font-medium text-sm underline"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
