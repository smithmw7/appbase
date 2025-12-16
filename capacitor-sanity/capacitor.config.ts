import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hightopgames.capacitorsanity',
  appName: 'CapacitorSanity',
  webDir: 'dist',
  server: {
    ios: {
      // Disable link preview for faster startup
      allowsLinkPreview: false,
      // Disable content inset for faster rendering
      contentInset: 'never',
    },
  },
  ios: {
    // Optimize for fast startup
    contentInset: 'never',
    scrollEnabled: true,
    // Disable unnecessary features
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
