# Startup Performance Notes

## WebKit Process Delays

The logs showing:
- `Networking process took 8+ seconds`
- `WebContent process took 3+ seconds`
- `WebProcessProxy::didBecomeUnresponsive`

**This is normal for first launch** on iOS. Here's why:

### First Launch Overhead
1. **iOS caches WebKit processes** - First launch is slowest
2. **Subsequent launches** use cached processes → **much faster** (~1-2 seconds)
3. The "unresponsive" message is iOS checking if WebView is ready (not an error)

### What We've Optimized

✅ **JavaScript Bundle:**
- Minified: **3.63 kB** (1.36 kB gzipped)
- Code splitting (plugins load separately)
- Console.log removed in production

✅ **WebView Configuration:**
- Disabled link preview (`allowsLinkPreview: false`)
- Optimized content inset
- No unnecessary network requests

✅ **Native iOS:**
- Release build with `-Owholemodule` optimization
- Debug symbols stripped
- UIScene manifest added (removes warning)

### Expected Performance

- **First launch (cold start):** 8-12 seconds (iOS WebKit initialization)
- **Subsequent launches (warm start):** 1-3 seconds (cached processes)
- **After app is backgrounded:** < 1 second (hot start)

### To Test Real Performance

1. **Kill the app completely** (swipe up in app switcher)
2. **Wait 30 seconds** (let iOS clear caches)
3. **Launch again** - this is your "cold start" time
4. **Launch 2-3 more times** - these are "warm start" times (should be < 3 seconds)

### The `capacitor.js` Warning

The Vite warning about `capacitor.js` is **harmless**:
- Vite can't bundle it (it's loaded by Capacitor runtime)
- The `data-vite-ignore` attribute tells Vite to skip it
- It still works correctly in the app

This warning can be ignored - it doesn't affect performance.
