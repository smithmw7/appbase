# Xcode Configuration for Sign in with Apple

## Required Manual Steps

Before the app will build and run with Apple Sign In, you **must** complete these Xcode configuration steps:

### Step 1: Add Entitlements File to Xcode Project

The `App.entitlements` file has been created, but Xcode doesn't know about it yet.

**Instructions:**

1. Open Xcode workspace:
   ```bash
   cd "container/ios/App"
   open App.xcworkspace
   ```

2. In Xcode's left sidebar (Project Navigator):
   - Find the "App" folder (blue icon)
   - Right-click on "App"
   - Select "Add Files to 'App'..."

3. In the file picker:
   - Navigate to: `container/ios/App/App/`
   - Select `App.entitlements`
   - ✅ Check "Copy items if needed"
   - ✅ Check "Add to targets: App"
   - Click "Add"

4. Verify the file appears in Xcode project navigator under "App" folder

### Step 2: Link Entitlements in Build Settings

Tell Xcode to use the entitlements file during code signing.

**Instructions:**

1. In Xcode, select the "App" target (top of project navigator)

2. Click "Build Settings" tab (next to "General")

3. In search box, type: `Code Signing Entitlements`

4. Double-click the value column and enter:
   ```
   App/App.entitlements
   ```

5. Press Enter to save

### Step 3: Add Sign in with Apple Capability

Add the capability to your app target.

**Instructions:**

1. Select "App" target

2. Click "Signing & Capabilities" tab

3. Click the "+ Capability" button (top left of capabilities section)

4. Type "Sign in with Apple" in search

5. Double-click "Sign in with Apple" to add it

6. Verify it appears in the capabilities list

7. The entitlements file should be automatically referenced

### Step 4: Update Code Signing

Ensure your app is properly signed with the new capability.

**Instructions:**

1. In "Signing & Capabilities" tab

2. Under "Signing":
   - ✅ Check "Automatically manage signing"
   - Select your Team from dropdown

3. Xcode will generate a new provisioning profile that includes:
   - Sign in with Apple capability
   - Your updated bundle ID (com.hightopgames.word)

4. Wait for "Provisioning profile is ready" or similar success message

### Step 5: Clean and Rebuild

Clear any cached build artifacts and rebuild.

**Instructions:**

1. In Xcode menu: Product → Clean Build Folder (⌘⇧K)

2. Wait for clean to complete

3. Product → Build (⌘B)

4. Verify build succeeds with no errors

## Verification Checklist

Before attempting to run:

- [ ] `App.entitlements` visible in Xcode project navigator
- [ ] Build Settings shows `Code Signing Entitlements: App/App.entitlements`
- [ ] Signing & Capabilities shows "Sign in with Apple" capability
- [ ] Team selected and provisioning profile generated
- [ ] Clean build completes successfully
- [ ] Physical iOS device connected (not simulator!)

## Common Issues

### Issue: "No such file or directory: App.entitlements"

**Cause:** Entitlements file not added to Xcode project

**Solution:** Complete Step 1 above - add the file to the project

### Issue: "Code signing entitlements file not found"

**Cause:** Build Settings path is incorrect

**Solution:** Complete Step 2 - ensure path is `App/App.entitlements` (case-sensitive)

### Issue: "Missing required entitlement: com.apple.developer.applesignin"

**Cause:** Capability not added in Xcode

**Solution:** Complete Step 3 - add capability via Signing & Capabilities tab

### Issue: "Provisioning profile doesn't include Sign in with Apple"

**Cause:** Xcode hasn't regenerated provisioning profile yet

**Solution:**
1. In Signing & Capabilities, uncheck "Automatically manage signing"
2. Check it again
3. Wait for Xcode to download new profile
4. Or manually regenerate in Apple Developer Portal

### Issue: "No code signing identity found"

**Cause:** No valid signing certificate

**Solution:**
1. Xcode → Preferences → Accounts
2. Select your Apple ID
3. Click "Download Manual Profiles"
4. Click "Manage Certificates"
5. Add "Apple Development" certificate if missing

## Next Steps

Once all steps are complete:

1. Connect physical iOS device via USB

2. Select device in Xcode toolbar (top, next to scheme selector)

3. Click Run button (▶) or press ⌘R

4. App will install and launch on device

5. Test Apple Sign In flow (see APPLE_SIGNIN_TESTING.md)

## Important Notes

- **Simulator won't work:** Apple Sign In requires a physical device
- **First run:** iOS will ask permission to use Apple Sign In - tap "Allow"
- **Sandbox mode:** Development builds use Apple's sandbox environment
- **Apple ID:** You can use any Apple ID for testing (doesn't need to be dev account)

## Need Help?

If you encounter issues:

1. Check Xcode's "Report Navigator" (⌘9) for detailed error messages
2. View Issue Navigator (⌘5) for build errors
3. Check console output during app launch
4. Verify all steps above completed in order

## Ready to Test

Once build succeeds and app runs on device:

**Tap the gray profile button → Tap "Sign in with Apple" → Follow iOS prompts**

See `APPLE_SIGNIN_TESTING.md` for complete testing scenarios.
