# Production Build Instructions

## Fast Startup Optimization

This app is configured for **production release builds** with optimizations for fast startup.

### Build for Production

```bash
# 1. Build optimized web bundle
npm run build:prod

# 2. Sync to iOS
npx cap sync ios

# 3. Open Xcode
npx cap open ios
```

### In Xcode: Use Release Configuration

1. **Select Release scheme:**
   - Product → Scheme → Edit Scheme
   - Run → Build Configuration → **Release**

2. **Or build directly:**
   - Product → Archive (automatically uses Release)
   - Or: `⌘B` then change scheme dropdown to "Release"

### Optimizations Applied

✅ **JavaScript:**
- Minified with Terser
- Console.log removed in production
- Code splitting (Capacitor plugins in separate chunks)
- Tree-shaking enabled

✅ **Native iOS:**
- Release build uses `-Owholemodule` optimization
- Debug symbols stripped
- No debug assertions

### Expected Startup Time

- **Debug build:** ~8-12 seconds (unoptimized)
- **Release build:** ~1-3 seconds (optimized)

### Verify Production Build

1. Build with Release configuration
2. Check bundle size in Xcode: Product → Archive → Distribute App → Export
3. App should load in < 3 seconds on device
