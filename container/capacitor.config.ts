import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.puzzleapp.wordstrike', // Will be overridden by build pipeline
  appName: 'Puzzle App Word Strike', // Will be overridden by build pipeline
  webDir: 'public',
  server: {
    android: {
      allowMixedContent: true,
    },
    ios: {
      // Optimize for fast startup
      allowsLinkPreview: false,
      contentInset: 'never',
    },
  },
  ios: {
    // Optimize for fast startup
    contentInset: 'never',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#667eea',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
