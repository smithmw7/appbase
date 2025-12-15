# Content Layer

The content layer consists of React web applications that can be swapped without modifying native code.

## Structure

- `shared/` - Shared bridge interface and TypeScript definitions
- `hello/` - Minimal smoke-test project
- `debug/` - Full system control project for testing
- `main/` - Production puzzle game (placeholder)

## Development

Each content project is a standalone React + Vite application:

```bash
cd content/hello
npm install
npm run dev      # Development server on port 3000
npm run build    # Production build
```

## Bridge Interface

All content projects use the shared bridge interface from `shared/src/bridge.ts`:

```typescript
import { bridge } from '@shared/bridge';

// Get app info
const info = await bridge.getAppInfo();

// Check entitlements
const entitlements = await bridge.getEntitlements();

// Trigger haptic
bridge.haptic('success');

// Play sound
bridge.playSound('click');

// Log analytics
bridge.analytics('puzzle_started', { puzzleId: '2025-01-15' });

// Show ad
await bridge.showInterstitialAd();
```

## Constraints

- **No native SDK imports** - Content must not import Firebase, AdMob, or RevenueCat directly
- **No platform conditionals** - Code should run identically in browser and native
- **No assumptions about container** - Content should work with any container implementation

## Building for Native

Content projects are built and synced to the Capacitor container:

```bash
# From project root
npm run build:hello    # Build hello world target
npm run build:debug    # Build debug target
npm run build:main     # Build main target
```

This will:
1. Build the React app
2. Sync assets to `container/public/`
3. Configure iOS project with target-specific settings

## Adding New Content Projects

1. Create a new directory in `content/`
2. Copy structure from `content/hello/`
3. Update `pipeline/configs/` with new target configuration
4. Add build scripts to root `package.json`
