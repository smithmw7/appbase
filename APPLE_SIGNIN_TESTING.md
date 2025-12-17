# Sign in with Apple - Testing Guide

## Implementation Complete

All code for Sign in with Apple has been implemented according to the plan. The system is ready for testing on a physical iOS device.

## What Was Implemented

### Native iOS Layer

1. **AppleSignInManager.swift** - New file
   - Handles Apple Sign In authorization flow
   - Generates secure nonce for authentication
   - Manages ASAuthorizationController delegate methods
   - Returns ID token and nonce to Firebase

2. **FirebaseManager.swift** - Extended
   - Added `signInWithApple(idToken:nonce:)` method
   - Added `linkAnonymousToApple(idToken:nonce:)` method
   - Uses OAuthProvider credential for Apple authentication

3. **FirebaseAuthPlugin.swift** - Extended
   - Added `signInWithApple()` Capacitor method
   - Added `linkAnonymousToApple()` Capacitor method
   - Bridges AppleSignInManager to JavaScript

4. **FirebaseAuthPlugin.m** - Updated
   - Registered new Apple Sign In methods with Capacitor

5. **App.entitlements** - New file
   - Added Sign in with Apple capability
   - Added associated domains for Firebase
   - Development APS environment

6. **Bundle ID** - Updated
   - Changed from `com.puzzleapp.wordstrike` to `com.hightopgames.word`
   - Updated in both Xcode project and Info.plist

### TypeScript Layer

1. **AuthManager.ts** - Extended
   - Added `signInWithApple()` method
   - Automatic anonymous account linking logic
   - Enhanced error handling for Apple-specific errors
   - Graceful cancellation handling

2. **SignInModal.tsx** - Updated
   - Added "Sign in with Apple" button above email/password
   - Black button with Apple logo (follows Apple guidelines)
   - Shows on both Sign Up and Sign In tabs
   - "or" divider separating Apple from email/password
   - Loading states during authentication

3. **FirebaseAuthPlugin.web.ts** - Extended
   - Added web stubs for Apple Sign In methods
   - Mock Apple authentication for development

## Configuration Requirements

### Xcode Project Setup

**IMPORTANT:** You must complete these steps in Xcode before the app will build successfully:

1. **Open Xcode project:**
   ```bash
   open "container/ios/App/App.xcworkspace"
   ```

2. **Add entitlements file to project:**
   - In Xcode, right-click on "App" folder
   - Select "Add Files to 'App'..."
   - Navigate to and select `App.entitlements`
   - Ensure "Copy items if needed" is checked
   - Click "Add"

3. **Link entitlements in build settings:**
   - Select "App" target
   - Go to "Build Settings"
   - Search for "Code Signing Entitlements"
   - Set value to: `App/App.entitlements`

4. **Add Sign in with Apple capability:**
   - Select "App" target
   - Go to "Signing & Capabilities" tab
   - Click "+ Capability" button
   - Search for and add "Sign in with Apple"
   - Verify entitlements file is auto-linked

5. **Update signing:**
   - Select your development team
   - Xcode will generate new provisioning profile
   - Profile must include "Sign in with Apple" capability

### Apple Developer Portal

Ensure your App ID has Sign in with Apple enabled:

1. Go to: https://developer.apple.com/account/resources/identifiers/list
2. Select your App ID: `com.hightopgames.word`
3. Verify "Sign in with Apple" is checked in capabilities
4. If not, enable it and save
5. Regenerate provisioning profiles

### Firebase Console

Ensure Apple authentication is enabled:

1. Go to: Firebase Console → Authentication → Sign-in methods
2. Find "Apple" provider
3. Click "Enable"
4. No additional configuration needed (using Firebase-managed Apple certificates)

## Testing on Physical Device

### Prerequisites

- ✅ Physical iOS device (iPhone/iPad) running iOS 13+
- ✅ Device connected to Mac via USB or WiFi
- ✅ Device added to Apple Developer account
- ✅ Valid provisioning profile with Sign in with Apple capability
- ✅ Xcode project configured as described above

**CRITICAL:** Apple Sign In does NOT work in iOS Simulator. You MUST test on a physical device.

### Test Scenarios

#### Test 1: Anonymous to Apple (Primary Flow)

**Steps:**
```
1. Install and launch app on physical device
2. App creates anonymous account automatically
3. Play 2-3 puzzles to generate progress
4. Tap profile button (top-right, gray circle)
5. Modal opens with "Sign in with Apple" button
6. Tap "Sign in with Apple"
7. iOS system prompt appears (Face ID / Touch ID)
8. Authenticate with Face ID or Touch ID
9. Choose email options (share or hide email)
10. Tap "Continue"
```

**Expected Results:**
- ✅ iOS Sign in with Apple sheet appears
- ✅ Authentication completes successfully
- ✅ Modal closes automatically
- ✅ Profile button changes from gray to purple
- ✅ Profile button shows first letter of Apple ID
- ✅ All puzzle progress preserved
- ✅ Data synced to Firebase

**Console Logs:**
```
[AuthManager] Linking anonymous account to Apple
[AppleSignInManager] Apple Sign In completed
[AuthManager] Apple account linked successfully: <userId>
[AuthManager] Firebase sync completed after Apple linking
```

#### Test 2: Fresh Install - Direct Apple Sign In

**Steps:**
```
1. Fresh app install (or delete and reinstall)
2. Launch app (creates anonymous)
3. Immediately tap profile button
4. Tap "Sign in with Apple"
5. Complete authentication
```

**Expected Results:**
- ✅ Creates new authenticated account
- ✅ No anonymous data to link (empty state)
- ✅ Profile button shows Apple indicator
- ✅ Can start playing with linked account

#### Test 3: User Cancellation

**Steps:**
```
1. Tap profile button
2. Tap "Sign in with Apple"
3. iOS prompt appears
4. Tap "Cancel" or swipe down to dismiss
```

**Expected Results:**
- ✅ Returns to sign-in modal
- ✅ No error message shown
- ✅ Can try again or use email/password
- ✅ Stays as anonymous user

#### Test 4: Sign Out and Re-Sign In

**Steps:**
```
1. After signing in with Apple (Test 1)
2. Tap profile button (now purple)
3. Modal shows profile view with email
4. Tap "Sign Out"
5. Profile button becomes gray placeholder
6. Tap profile button again
7. Tap "Sign in with Apple"
8. Authenticate again
```

**Expected Results:**
- ✅ Signs out successfully
- ✅ Local data remains (not deleted)
- ✅ Can sign back in with Apple
- ✅ Data loads from Firebase
- ✅ Progress restored

#### Test 5: Email Privacy Options

**Steps:**
```
1. New user signing in with Apple
2. On Apple prompt, test both email options:
   a. "Share My Email"
   b. "Hide My Email"
```

**Expected Results:**
- ✅ Share option: Real Apple ID email used
- ✅ Hide option: Private relay email (randomstring@privaterelay.appleid.com)
- ✅ Both options work correctly
- ✅ Profile shows appropriate indicator

## UI Verification

### Sign In Modal

**Location:** Slides up from bottom when profile button tapped

**For Anonymous Users (Sign Up/Sign In tabs):**
```
┌─────────────────────────────────────┐
│  × Close                             │
│                                      │
│  Create Account / Sign In            │
│  ────────────────────────────────────│
│                                      │
│  ┌───────────────────────────────┐  │
│  │   🍎  Sign in with Apple      │  │ ← Black button
│  └───────────────────────────────┘  │
│                                      │
│           ─── or ───                 │
│                                      │
│  [Sign Up Tab] [Sign In Tab]        │
│                                      │
│  Email: _________________________    │
│  Password: ______________________    │
│  ...                                 │
└──────────────────────────────────────┘
```

**Button Styling:**
- Background: Black (#000000)
- Text: White
- Apple logo SVG (left side)
- Hover: Dark gray (#1f1f1f)
- Loading: Shows "Signing in..."

### Profile Button States

**Anonymous:**
- Gray circle (#94a3b8)
- User icon outline (white)

**Apple Authenticated:**
- Purple circle (#8b5cf6)
- Shows first letter of email in white
- Example: "J" for john@icloud.com

## Troubleshooting

### Build Errors

**Error:** "Missing entitlements file"
**Solution:** Ensure `App.entitlements` is added to Xcode project and linked in build settings

**Error:** "No code signing identity found"
**Solution:** Select your development team in Xcode signing settings

**Error:** "Capability not found"
**Solution:** Add "Sign in with Apple" capability in Xcode Signing & Capabilities tab

### Runtime Errors

**Error:** "Failed to get Apple credentials"
**Solution:** 
- Ensure running on physical device (not simulator)
- Check Sign in with Apple is enabled in Apple Developer Portal
- Verify provisioning profile includes the capability

**Error:** "No anonymous user to link"
**Solution:**
- App should auto-create anonymous user on launch
- Check Firebase Anonymous authentication is enabled

**Error:** "This account is already linked to another user"
**Solution:**
- Apple ID already linked to different Firebase account
- User must sign out of other account first
- Or sign in instead of sign up

### Console Warnings

**Warning:** "AppleSignInManager.shared.signIn called on web"
**Solution:** This is expected - web stub is being used. Only works on physical iOS device.

## Success Criteria

Sign in with Apple is working correctly when:

- ✅ iOS system prompt appears on physical device
- ✅ Anonymous account automatically links to Apple ID
- ✅ UID remains the same (data preserved)
- ✅ Profile button updates from gray to purple
- ✅ User can sign out and sign back in
- ✅ User cancellation handled gracefully (no errors)
- ✅ Both email privacy options work
- ✅ Firebase sync activates after linking
- ✅ All player progress preserved

## Next Steps After Testing

Once testing confirms everything works:

1. **Test with TestFlight:**
   - Archive app in Xcode
   - Upload to App Store Connect
   - Create TestFlight build
   - Test on multiple devices

2. **Monitor Firebase:**
   - Check Firebase Authentication users
   - Verify Apple provider shows up
   - Check Firestore player data is syncing

3. **Production Considerations:**
   - Apple Sign In uses sandbox in development
   - Production Apple IDs work differently
   - Test with production Firebase environment
   - Verify all privacy policies mention Apple Sign In

## Documentation

- Plan: `.cursor/plans/sign_in_with_apple_31bdbd9d.plan.md`
- Email/Password auth: `AUTH_TESTING_GUIDE.md`
- Implementation summary: `AUTH_IMPLEMENTATION_SUMMARY.md`

## Support

If issues occur during testing:

1. Check Xcode console for detailed error messages
2. Verify all configuration steps completed
3. Ensure physical device is used (not simulator)
4. Check Firebase Console authentication logs
5. Verify provisioning profile is valid

**Build is ready! Connect physical iOS device and test.** 🍎
