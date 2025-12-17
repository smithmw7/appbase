# Firebase Setup Guide

Quick guide to deploy all Firebase configurations from recent implementations.

## Current Status

✅ **Configured:**
- Firestore rules (player data security)
- Remote Config template (with puzzle parameters)
- Firebase project: `com-hightopgames-firebase`

⚠️ **Needs Deployment:**
- Your Firebase authentication is expired
- Firestore rules need to be deployed
- Remote Config needs to be deployed
- Firebase Hosting needs to be initialized (optional)

## Step 1: Reauthorize Firebase CLI

Your Firebase authentication has expired. Run:

```bash
npx firebase-tools login --reauth
```

This will open a browser window to sign in again.

## Step 2: Deploy Firebase Configurations

I've created a deployment script for you:

```bash
# Deploy everything at once
./scripts/firebase-deploy.sh
```

This will:
- Deploy Firestore rules for player data security
- Deploy Remote Config with puzzle data parameters
- Optionally deploy Firebase Hosting (if initialized)

### Manual deployment (alternative):

```bash
# Deploy Firestore rules
npx firebase-tools deploy --only firestore:rules

# Deploy Remote Config
npx firebase-tools deploy --only remoteconfig
```

## Step 3: Initialize Firebase Hosting (Recommended)

Firebase Hosting is the easiest way to host your puzzle JSON files:

```bash
# Initialize hosting
npx firebase-tools init hosting

# When prompted:
# - Public directory: public
# - Configure as single-page app: No
# - Set up automatic builds: No
# - Overwrite index.html: No
```

## Step 4: Deploy Your First Puzzle Pack

Once hosting is initialized, use this script:

```bash
# Deploy puzzles with version
./scripts/deploy-puzzles.sh v1
```

This will:
- Copy `puzzles.json` to `public/puzzles-v1.json`
- Calculate SHA-256 hash
- Deploy to Firebase Hosting
- Show you the URL and hash

Example output:
```
✅ Puzzle data deployed!

📝 Puzzle URL:
   https://com-hightopgames-firebase.web.app/puzzles-v1.json

🔐 Version hash: a3f7c2d1b5e8...
```

## Step 5: Configure Remote Config in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/com-hightopgames-firebase/config)

2. Click on **Remote Config** in the left menu

3. Find the `puzzle_data_url` parameter and click **Edit**:
   ```
   Value: https://com-hightopgames-firebase.web.app/puzzles-v1.json
   ```

4. Find the `puzzle_data_version` parameter and click **Edit**:
   ```
   Value: <paste the hash from deploy output>
   ```

5. Click **Publish changes**

## Testing

### Test in Simulator:
```bash
# Build and run
node pipeline/scripts/build-all.js word-strike
```

### In the app:
1. Open Settings (gear icon)
2. Tap "Settings" header text to show debug panel
3. Check "Puzzle Data" section for:
   - Version hash
   - Source (should show "cached" or "remote" after first fetch)
   - Puzzle count

### Test update:
1. Click "Check for Updates" in debug panel
2. Watch Xcode console for logs:
   ```
   [RemotePuzzleLoader] Fetching Remote Config...
   [RemotePuzzleLoader] Puzzle data URL: https://...
   [RemotePuzzleLoader] Update check complete
   ```

## Deploying Updated Puzzles

When you have new puzzle data:

```bash
# 1. Update content/word-strike/puzzles.json with new puzzles

# 2. Deploy with a new version
./scripts/deploy-puzzles.sh v2

# 3. Update Remote Config in Firebase Console:
#    - puzzle_data_url: https://your-project.web.app/puzzles-v2.json
#    - puzzle_data_version: <new hash>
#    - Publish changes

# 4. Test in app:
#    - Open debug panel
#    - Click "Check for Updates"
#    - New puzzles should download
```

## What Was Updated

### New Remote Config Parameters:
- **puzzle_data_url** - URL to puzzle JSON file
- **puzzle_data_version** - SHA-256 hash for validation
- **min_app_version** - Minimum app version required

### Firestore Rules:
- Players can only read/write their own data
- Path: `/players/{userId}`
- Requires authentication

### Scripts Created:
- `scripts/firebase-deploy.sh` - Deploy all Firebase configs
- `scripts/deploy-puzzles.sh` - Deploy puzzle JSON to hosting

## Troubleshooting

**"Authentication Error: Your credentials are no longer valid"**
```bash
npx firebase-tools login --reauth
```

**"Firebase Hosting not initialized"**
```bash
npx firebase-tools init hosting
```

**Can't find Firebase project**
```bash
# Check current project
npx firebase-tools use

# List all projects
npx firebase-tools projects:list

# Switch project
npx firebase-tools use com-hightopgames-firebase
```

**Puzzles not updating in app**
1. Check Firebase Console → Remote Config
2. Verify `puzzle_data_url` is set correctly
3. Verify URL is publicly accessible (test in browser)
4. Check Xcode console for error messages

## Quick Reference

```bash
# Reauth Firebase
npx firebase-tools login --reauth

# Deploy Firebase configs
./scripts/firebase-deploy.sh

# Deploy puzzles
./scripts/deploy-puzzles.sh v1

# Build and test
node pipeline/scripts/build-all.js word-strike
```

## Firebase Console Links

- **Project Overview:** https://console.firebase.google.com/project/com-hightopgames-firebase
- **Remote Config:** https://console.firebase.google.com/project/com-hightopgames-firebase/config
- **Firestore:** https://console.firebase.google.com/project/com-hightopgames-firebase/firestore
- **Hosting:** https://console.firebase.google.com/project/com-hightopgames-firebase/hosting
- **Authentication:** https://console.firebase.google.com/project/com-hightopgames-firebase/authentication

## Next Steps

1. ✅ Read this guide
2. ⚠️ Run `npx firebase-tools login --reauth`
3. ⚠️ Run `./scripts/firebase-deploy.sh`
4. ⚠️ Initialize hosting: `npx firebase-tools init hosting`
5. ⚠️ Deploy puzzles: `./scripts/deploy-puzzles.sh v1`
6. ⚠️ Update Remote Config in Firebase Console
7. ✅ Test in simulator
