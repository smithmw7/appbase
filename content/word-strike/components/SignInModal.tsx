import React, { useState } from 'react';
import { authManager } from '../data/AuthManager';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAnonymous: boolean;
  userEmail: string | null;
}

type AuthTab = 'signin' | 'signup' | 'reset' | 'profile';

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, isAnonymous, userEmail }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(isAnonymous ? 'signup' : 'profile');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset form state
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setResetEmail('');
    setError('');
    setResetSent(false);
    setActiveTab(isAnonymous ? 'signup' : 'profile');
    onClose();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
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
      console.log('[SignInModal] Sign up successful');
      handleClose();
    } catch (error: any) {
      console.error('[SignInModal] Sign up error:', error);
      setError(error.message || 'Sign up failed');
      
      // If email already exists, offer to switch to sign in
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in instead.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await authManager.signInWithEmail(email, password);
      console.log('[SignInModal] Sign in successful');
      handleClose();
    } catch (error: any) {
      console.error('[SignInModal] Sign in error:', error);
      setError(error.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(resetEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authManager.resetPassword(resetEmail);
      setResetSent(true);
      console.log('[SignInModal] Password reset email sent');
    } catch (error: any) {
      console.error('[SignInModal] Password reset error:', error);
      setError(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <span className="text-slate-600 text-xl">×</span>
        </button>

        {/* Content */}
        <div className="p-6 pb-8">
          {/* Profile View (Authenticated User) */}
          {activeTab === 'profile' && !isAnonymous && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Profile</h2>
              
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
                className="w-full py-3 px-4 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          )}

          {/* Sign Up Tab */}
          {activeTab === 'signup' && isAnonymous && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Account</h2>
              <p className="text-slate-600 mb-6">Sign up to save your progress</p>

              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setActiveTab('signup')}
                  className="flex-1 py-2 text-center font-medium border-b-2 border-purple-500 text-purple-600"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setActiveTab('signin')}
                  className="flex-1 py-2 text-center font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-600"
                >
                  Sign In
                </button>
              </div>

              <form onSubmit={handleSignUp}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="your@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

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
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="At least 8 characters"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sign In Tab */}
          {activeTab === 'signin' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
              <p className="text-slate-600 mb-6">Sign in to your account</p>

              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setActiveTab('signup')}
                  className="flex-1 py-2 text-center font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-600"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setActiveTab('signin')}
                  className="flex-1 py-2 text-center font-medium border-b-2 border-purple-500 text-purple-600"
                >
                  Sign In
                </button>
              </div>

              <form onSubmit={handleSignIn}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="your@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

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
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your password"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTab('reset')}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Reset Tab */}
          {activeTab === 'reset' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Reset Password</h2>
              <p className="text-slate-600 mb-6">
                {resetSent 
                  ? 'Check your email for reset instructions'
                  : 'Enter your email to receive reset instructions'}
              </p>

              {resetSent ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    Password reset email sent! Check your inbox.
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('signin');
                      setResetSent(false);
                      setResetEmail('');
                    }}
                    className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          setError('');
                        }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="your@email.com"
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
                      className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Sending...' : 'Send Reset Email'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('signin');
                        setResetEmail('');
                        setError('');
                      }}
                      className="w-full py-2 text-slate-600 hover:text-slate-800 font-medium"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
