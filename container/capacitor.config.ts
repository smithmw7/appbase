import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.puzzleapp.main', // Will be overridden by build pipeline
  appName: 'Puzzle App', // Will be overridden by build pipeline
  webDir: 'public',
  server: {
    android: {
      allowMixedContent: true,
    },
    ios: {
      allowsLinkPreview: false,
    },
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
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
