import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Production optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        passes: 2, // Multiple passes for better compression
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Code splitting for faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          'capacitor-core': ['@capacitor/core'],
          'capacitor-app': ['@capacitor/app'],
          'capacitor-haptics': ['@capacitor/haptics'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Source maps only in dev (not needed in production)
    sourcemap: false,
    // Optimize assets
    assetsInlineLimit: 4096, // Inline small assets as base64
    // Target modern browsers for smaller bundles
    target: 'es2022',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['@capacitor/core', '@capacitor/app', '@capacitor/haptics'],
  },
  // Suppress capacitor.js warning (it's loaded by Capacitor runtime, not bundled)
  html: {
    minify: {
      ignoreCustomComments: [/capacitor\.js/],
    },
  },
});
