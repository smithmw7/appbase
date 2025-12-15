# Firebase CLI Setup Guide

## What I Can Do with Firebase CLI

✅ **Set up Remote Config** - Create and publish all required keys
✅ **List/create iOS apps** - See what apps are registered
✅ **Download config files** - Get GoogleService-Info.plist programmatically
⚠️ **Login required** - You'll need to authenticate first

## Authentication Required

Before I can use Firebase CLI, you need to authenticate:

```bash
cd "/Users/marshallsmith/Game Puzzle/App"
npx firebase login
```

This will:
1. Open your browser
2. Ask you to sign in with Google
3. Grant permissions to Firebase CLI
4. Return to terminal when complete

## What I've Set Up

1. **`.firebaserc`** - Project configuration pointing to `com-hightopgames-firebase`
2. **`firebase.json`** - Firebase configuration file
3. **`firebase-remote-config.template.json`** - Remote Config template with all 6 required keys

## Next Steps

### 1. Authenticate (You need to do this)

```bash
cd "/Users/marshallsmith/Game Puzzle/App"
npx firebase login
```

### 2. Then I Can:

**Deploy Remote Config:**
```bash
npx firebase deploy --only remoteconfig
```

**List/Create iOS Apps:**
```bash
npx firebase apps:list IOS
npx firebase apps:create IOS --bundle-id=com.puzzleapp.main
```

**Download GoogleService-Info.plist:**
```bash
npx firebase apps:sdkconfig IOS 1:74002814264:ios:9d080eec9bb5da1c76ddcd > container/ios/App/App/GoogleService-Info.plist
```

## Current Status

- ✅ Firebase CLI installed and working (v13.35.1)
- ✅ Firebase CLI configuration files created (`.firebaserc`, `firebase.json`)
- ✅ Authentication completed
- ✅ iOS app created (`com.puzzleapp.main`)
- ✅ GoogleService-Info.plist downloaded
- ✅ Remote Config template created with 6 keys
- ✅ Remote Config published to Firebase
- ✅ Dependencies installed and permissions fixed

**Firebase setup is complete!** 🎉

## Setup Complete ✅

All Firebase setup steps have been completed:

1. ✅ **Firebase CLI authenticated** - You're logged in
2. ✅ **iOS app created** - `com.puzzleapp.main` (App ID: `1:74002814264:ios:9d080eec9bb5da1c76ddcd`)
3. ✅ **GoogleService-Info.plist downloaded** - Located at `container/ios/App/App/GoogleService-Info.plist`
4. ✅ **Remote Config published** - Template with 6 keys deployed:
   - `enable_ads` (BOOLEAN)
   - `ad_unit_id` (STRING)
   - `revenue_cat_api_key` (STRING)
   - `remove_ads_product_id` (STRING)
   - `app_version` (STRING)
   - `maintenance_mode` (BOOLEAN)

## Available Commands

You can use these npm scripts or Firebase CLI commands:

```bash
# List iOS apps
npm run firebase:apps
# or
npx firebase apps:list IOS

# Download config file again (if needed)
npx firebase apps:sdkconfig IOS 1:74002814264:ios:9d080eec9bb5da1c76ddcd > container/ios/App/App/GoogleService-Info.plist

# Deploy Remote Config updates
npx firebase deploy --only remoteconfig

# Get current Remote Config
npx firebase remoteconfig:get
```

## Troubleshooting

If you encounter permission errors, run:
```bash
npm install
```

This will ensure all dependencies are properly installed.
