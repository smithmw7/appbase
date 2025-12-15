# Container Layer

The container is a Capacitor iOS native wrapper that provides stable native capabilities to replaceable web content.

## Structure

- `ios/` - Xcode project and native code
- `src/` - TypeScript plugin definitions
- `public/` - Web assets (synced from content projects)

## Native Plugins

### GameBridge

Main bridge plugin implementing the NativeBridge interface:
- App info (version, build number)
- Entitlements (Remove Ads status)
- Ads (interstitial display)
- Haptics (light, medium, heavy, success, error)
- Audio (sound playback)
- Analytics (Firebase Analytics)
- Debug methods (debug builds only)

### AdMob

Google AdMob integration for interstitial ads:
- Ad loading and caching
- Entitlement checks before display
- Frequency capping
- Non-personalized ads (ATT compliance)

### IAP (RevenueCat)

In-app purchase integration:
- "Remove Ads" non-consumable product
- Entitlement checking and caching
- Purchase flow
- Restore purchases

### LocalStorage

SQLite database for local data:
- Puzzles (id, date, data, completion status)
- Player stats (streak, max streak, histogram)
- Settings (sound, haptics, colorblind, tutorial)
- Entitlements cache
- Schema migrations

## Firebase Integration

`FirebaseManager.swift` provides:
- Analytics initialization and logging
- Remote Config fetching and caching
- Config value accessors

## Development

### Setup

```bash
cd container
npm install
npx cap sync ios
```

### Opening in Xcode

```bash
npx cap open ios
```

### Adding Native Code

1. Add Swift files to `ios/App/App/`
2. Create Objective-C bridge file (`.m`) for Capacitor registration
3. Update `Podfile` if new dependencies are needed
4. Run `pod install` in `ios/App/`

## Configuration

The container is configured per-build-target via the build pipeline:
- Bundle ID
- App name
- Firebase config
- Ad unit IDs
- IAP product IDs

## Rules

- **No UI besides WebView** - All UI is rendered by web content
- **No game logic** - Gameplay logic lives in content projects
- **No content-specific assumptions** - Container must work with any content bundle
- **No remote code execution** - Only data (JSON) is fetched remotely
