# Setup Guide - Building to Device

## Current Status

✅ **All dependencies installed**
✅ **All content projects build successfully**
✅ **Build pipeline scripts working**
⚠️ **iOS project needs manual setup steps**

## What's Ready

1. **All npm dependencies installed** - Root, container, and all content projects
2. **Content builds working** - hello, debug, and main all build successfully
3. **Build scripts functional** - build-content, sync-capacitor work correctly
4. **Native plugins created** - All Swift plugins are in place

## What Needs to Be Done

### 1. Initialize Capacitor iOS Project (First Time Only)

The iOS project exists but needs to be properly initialized:

```bash
cd container
npx cap sync ios
```

This will:
- Copy web assets to iOS project
- Register plugins
- Create necessary iOS project files

### 2. Fix Podfile (Required)

The Podfile needs to specify the Xcode project. After running `cap sync`, edit `container/ios/App/Podfile` and add at the top:

```ruby
project 'App/App.xcodeproj'
```

Or if using a workspace:
```ruby
workspace 'App.xcworkspace'
```

### 3. Install CocoaPods Dependencies

```bash
cd container/ios/App
pod install
```

**Note:** If you see gem errors about `ffi` or `json`, you may need to:
```bash
gem pristine ffi --version 1.15.5
gem pristine json --version 1.8.6
```

Or update your Ruby/CocoaPods setup.

### 4. Add Firebase Configuration

1. Download `GoogleService-Info.plist` from Firebase Console
2. Place it in `container/ios/App/App/`
3. The build pipeline will copy it to the correct location per target

### 5. Configure AdMob & RevenueCat (Optional for Testing)

Add to `Info.plist` (or via build pipeline config):
- `GADInterstitialAdUnitID` - Your AdMob ad unit ID
- `RevenueCatAPIKey` - Your RevenueCat API key
- `RemoveAdsProductID` - Your IAP product ID

### 6. Open in Xcode

```bash
cd container
npx cap open ios
```

Or manually:
```bash
cd container/ios/App
open App.xcworkspace  # Use workspace, not .xcodeproj
```

### 7. Build and Run

1. Select your target device/simulator in Xcode
2. Click Run (⌘R)
3. The app should build and launch

## Testing Content

All content projects can be tested in the browser first:

```bash
# Hello World
cd content/hello
npm run dev
# Open http://localhost:3000

# Debug
cd content/debug
npm run dev
# Open http://localhost:3001

# Main
cd content/main
npm run dev
# Open http://localhost:3002
```

## Build Pipeline Usage

Once iOS is set up, use the build pipeline:

```bash
# Build hello world target
npm run build:hello

# Build debug target
npm run build:debug

# Build main target
npm run build:main
```

Each command:
1. Builds the React content
2. Syncs to Capacitor
3. Configures iOS project
4. Ready for Xcode build

## Known Issues

1. **Pod install fails** - Need to fix Podfile project path first
2. **Gem warnings** - Can be ignored or fixed with `gem pristine`
3. **Firebase config missing** - Required for production, optional for testing
4. **Info.plist** - Will be created by Capacitor on first sync

## Next Steps

1. Run `npx cap sync ios` in container directory
2. Fix Podfile with project path
3. Run `pod install`
4. Add Firebase config (if using Firebase features)
5. Open in Xcode and build

The project structure is complete and ready - just needs the iOS native setup steps above.
