# Quick Start: Sign in with Apple

## ✅ Implementation Status: COMPLETE

All code has been implemented. Follow these steps to test on your device.

## 🚀 Quick Start (5 Steps)

### Step 1: Open Xcode (Already Open)

Xcode should already be open from the build script. If not:

```bash
cd "container/ios/App"
open App.xcworkspace
```

### Step 2: Add Entitlements File to Project

**In Xcode:**
1. Right-click "App" folder in left sidebar
2. "Add Files to 'App'..."
3. Select `App/App.entitlements`
4. ✅ Check "Copy items if needed"
5. Click "Add"

### Step 3: Configure Build Settings

**In Xcode:**
1. Select "App" target (top of sidebar)
2. "Build Settings" tab
3. Search: `Code Signing Entitlements`
4. Set value: `App/App.entitlements`

### Step 4: Add Capability

**In Xcode:**
1. "Signing & Capabilities" tab
2. Click "+ Capability"
3. Add "Sign in with Apple"
4. Select your Team
5. Wait for provisioning profile

### Step 5: Build and Test

**In Xcode:**
1. Connect physical iPhone/iPad (USB or WiFi)
2. Select device in toolbar
3. Click Run ▶️ (or press ⌘R)
4. App installs and launches

**On Device:**
1. Tap gray profile button (top-right)
2. Tap "Sign in with Apple" (black button)
3. Authenticate with Face ID / Touch ID
4. Account linked! Profile button turns purple ✅

## 🎯 Expected Behavior

**Before Sign In:**
- Profile button: Gray circle with user icon
- User is anonymous
- Can play puzzles and earn progress

**After Sign In:**
- Profile button: Purple circle with email initial
- User authenticated with Apple
- All progress preserved (same UID!)
- Data synced to Firebase

## ⚠️ Important Notes

- **Must use physical device** (simulator won't work)
- **iOS 13+ required**
- **Bundle ID changed** to `com.hightopgames.word`
- **First sign in** links anonymous account automatically

## 📚 Detailed Guides

- **Xcode Setup:** `APPLE_SIGNIN_XCODE_SETUP.md` (step-by-step screenshots)
- **Testing:** `APPLE_SIGNIN_TESTING.md` (all test scenarios)
- **Implementation:** `APPLE_SIGNIN_IMPLEMENTATION_COMPLETE.md` (technical details)

## 🐛 Troubleshooting

**Build fails?**
→ Check you completed Steps 2-4 in Xcode

**"Missing entitlements file"?**
→ Step 2: Add file to Xcode project

**"No code signing identity"?**
→ Step 4: Select your Team

**Runtime error on device?**
→ Check Firebase Console → Authentication → Apple is enabled

## 🎉 Success Looks Like

```
[AuthManager] Linking anonymous account to Apple
[AppleSignInManager] Apple Sign In completed
[AuthManager] Apple account linked successfully
[AuthManager] Firebase sync completed after Apple linking
```

**Profile button:** Gray → Purple ✅  
**User data:** Preserved ✅  
**Firebase sync:** Active ✅

## Need Help?

1. Check Xcode console for errors
2. Review detailed guides above
3. Verify physical device (not simulator)
4. Ensure Apple Sign In enabled in Apple Developer Portal

**Ready to test! 🍎**
