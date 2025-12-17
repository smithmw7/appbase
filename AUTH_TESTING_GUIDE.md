# Authentication System Testing Guide

## Overview

The authentication system has been fully implemented with:
- ✅ Email/Password authentication
- ✅ Automatic anonymous account linking
- ✅ Profile button with avatar states
- ✅ Slide-up sign-in modal
- ✅ Standard iOS UI styling
- ✅ Comprehensive error handling

## Quick Start Testing

### 1. Build and Run
```bash
# App should already be building...
# Once Xcode opens, run the app in simulator
```

### 2. First Launch (Anonymous User)
1. App launches → automatically creates anonymous account
2. Look for profile button in top-right (gray placeholder icon)
3. Play a few puzzles to generate player data
4. Check debug panel → User ID should show anonymous ID

## Test Scenarios

### Scenario 1: Anonymous to Email Sign Up (Account Linking)

**Steps:**
1. Launch app → play 2-3 puzzles as anonymous user
2. Tap gray profile button in top-right
3. Modal slides up from bottom
4. Sign Up tab should be active
5. Enter email: `test@example.com`
6. Enter password: `password123` (8+ chars)
7. Confirm password: `password123`
8. Tap "Sign Up"

**Expected Results:**
- ✅ Account created successfully
- ✅ Profile button changes to purple with "T" initial
- ✅ Player progress preserved (anonymous data linked)
- ✅ Modal closes automatically
- ✅ Console shows: `[AuthManager] Account linked successfully`

**Xcode Console Logs:**
```
[AuthManager] Linking anonymous account to email: test@example.com
[AuthManager] Account linked successfully: <userId>
[AuthManager] Firebase sync completed after linking
```

### Scenario 2: Sign Out and Sign In

**Steps:**
1. After signing up in Scenario 1, tap profile button
2. Modal shows "Profile" view with email
3. Tap "Sign Out" button
4. Confirm sign out

**Expected Results:**
- ✅ Signed out successfully
- ✅ Profile button becomes gray placeholder
- ✅ Local data remains (not cleared)
- ✅ Firebase sync stops

**Then Sign In:**
1. Tap gray profile button
2. Switch to "Sign In" tab
3. Enter email: `test@example.com`
4. Enter password: `password123`
5. Tap "Sign In"

**Expected Results:**
- ✅ Signed in successfully
- ✅ Profile button shows "T" initial
- ✅ Player data loads from Firebase
- ✅ Progress synced

### Scenario 3: Email Already in Use

**Steps:**
1. Sign out (if signed in)
2. Create new anonymous account (may need to clear app data)
3. Try to sign up with: `test@example.com` (already used)
4. Tap "Sign Up"

**Expected Results:**
- ✅ Error shown: "This email is already registered"
- ✅ Suggestion to sign in instead
- ✅ User stays anonymous
- ✅ Can switch to Sign In tab

### Scenario 4: Wrong Password

**Steps:**
1. On Sign In tab
2. Enter email: `test@example.com`
3. Enter password: `wrongpassword`
4. Tap "Sign In"

**Expected Results:**
- ✅ Error shown: "Incorrect password"
- ✅ Form still accessible
- ✅ Can retry with correct password

### Scenario 5: Password Reset

**Steps:**
1. On Sign In tab
2. Tap "Forgot password?" link
3. Password Reset view appears
4. Enter email: `test@example.com`
5. Tap "Send Reset Email"

**Expected Results:**
- ✅ Success message: "Check your email for reset instructions"
- ✅ Firebase sends password reset email
- ✅ Can return to Sign In

**Note:** You can check if email was sent in Firebase Console → Authentication → Templates

### Scenario 6: Form Validation

**Test Invalid Email:**
1. Sign Up tab
2. Enter email: `notanemail`
3. Try to submit

**Expected:** Error: "Please enter a valid email address"

**Test Weak Password:**
1. Enter email: `test2@example.com`
2. Enter password: `1234` (less than 8 chars)
3. Try to submit

**Expected:** Error: "Password must be at least 8 characters"

**Test Password Mismatch:**
1. Enter email: `test2@example.com`
2. Enter password: `password123`
3. Confirm password: `password456`
4. Try to submit

**Expected:** Error: "Passwords do not match"

### Scenario 7: Network Error Handling

**Steps:**
1. Enable Airplane Mode
2. Try to sign up or sign in

**Expected Results:**
- ✅ Error shown: "Network error. Check your connection"
- ✅ App doesn't crash
- ✅ Can retry after re-enabling network

### Scenario 8: Mid-Game Sign Up

**Steps:**
1. Start a puzzle as anonymous
2. Place a few tiles on board
3. Tap profile button
4. Sign up with email
5. Complete sign up

**Expected Results:**
- ✅ Current game continues uninterrupted
- ✅ Account linked successfully
- ✅ When puzzle ends, data saves to linked account

## UI Elements to Verify

### Profile Button States

**Anonymous User:**
- Gray circular button (#94a3b8)
- User icon outline
- Located next to "tiles left" counter

**Authenticated User:**
- Purple circular button (#8b5cf6)
- Shows first letter of email in white
- Example: "T" for test@example.com

### Sign In Modal

**Layout:**
- Slides up from bottom (covers full screen)
- White background, rounded top corners
- Close button (×) in top-right
- Two tabs: "Sign Up" and "Sign In"

**Sign Up Tab:**
- Email input field
- Password input field
- Confirm Password input field
- "Sign Up" button (purple)
- Tab indicator (purple underline)

**Sign In Tab:**
- Email input field
- Password input field
- "Forgot password?" link
- "Sign In" button (purple)

**Password Reset View:**
- Email input field
- "Send Reset Email" button
- "Back to Sign In" button
- Success message after sending

**Profile View (Authenticated):**
- Avatar circle with initial
- Email address
- "Signed in" status
- "Sign Out" button (red)

### Animations

**Modal Slide Up:**
- Smooth 0.3s animation from bottom
- Backdrop fades in

**Button States:**
- Hover effects on inputs (ring outline)
- Loading states (button text changes)
- Disabled states (grayed out)

## Debug Panel Integration

The debug panel should now show:

**Authentication Section:**
- User ID (truncated)
- Status: ✅ Signed In or ❌ Not signed in
- Email address (if not anonymous)
- Last sync time

**Updated by auth events:**
- Sign up → Status updates
- Sign in → Shows email
- Sign out → Clears email
- Account linking → Preserves data

## Firebase Console Verification

### Check Authentication Users

1. Go to: https://console.firebase.google.com/project/com-hightopgames-firebase/authentication/users

2. Should see:
   - Anonymous users (before linking)
   - Email/password users (after sign up)
   - Linked accounts (same UID, method changes from anonymous to email)

### Check Firestore Data

1. Go to: https://console.firebase.google.com/project/com-hightopgames-firebase/firestore/data

2. Navigate to `players` collection

3. Find your user document (by UID)

4. Verify:
   - Player data exists
   - Stats are tracked
   - Puzzle progress saved
   - Activity timestamps

## Common Issues & Solutions

### "Failed to sign in anonymously"
- Check Firebase Console → Authentication → Sign-in methods
- Verify "Anonymous" is enabled

### "This email is already registered"
- Normal behavior if email already used
- Switch to Sign In tab instead
- Or use different email

### "Network error. Check your connection"
- Check internet connection
- Verify Firebase project is accessible
- Check Xcode console for detailed error

### Profile button not showing
- Check that `authUser` state is set
- Verify `ProfileButton` component is rendered
- Look for React errors in console

### Modal not opening
- Check `showSignInModal` state
- Verify onClick handler on profile button
- Look for z-index conflicts

### Account not linking
- Verify user is anonymous before linking
- Check Xcode console for error details
- Ensure email not already used

## Expected Console Output

### Successful Sign Up (Anonymous → Email):
```
[AuthManager] Linking anonymous account to email: test@example.com
[FirebaseManager.swift] Linking anonymous account to email credential
[AuthManager] Account linked successfully: abc123def456...
[AuthManager] Firebase sync completed after linking
[PlayerDataManager] Syncing player data to Firebase
[FirebaseSyncManager] Sync completed successfully
```

### Successful Sign In:
```
[AuthManager] Signing in with email: test@example.com
[FirebaseManager.swift] Signing in with email and password
[AuthManager] Signed in successfully: abc123def456...
[PlayerDataManager] Loading player data for user: abc123def456...
[FirebaseSyncManager] Performing initial sync
[FirebaseSyncManager] Sync completed successfully
```

### Sign Out:
```
[AuthManager] Signing out
[FirebaseManager.swift] Signing out current user
[PlayerDataManager] Ending session
[FirebaseSyncManager] Stopping periodic sync
[AuthManager] Signed out successfully
```

## Security Verification

### Firestore Rules Test

Try accessing another user's data:
1. Sign in as user A
2. Note user A's UID
3. Sign out
4. Sign in as user B
5. Try to manually access user A's document

**Expected:** Access denied (Firestore rules prevent it)

### Account Security

- ✅ Anonymous accounts have unique UIDs
- ✅ Email accounts require authentication
- ✅ Users can only access their own data
- ✅ Password reset requires email ownership
- ✅ Account linking preserves data integrity

## Feature Checklist

**Authentication:**
- [x] Anonymous sign-in (automatic on launch)
- [x] Email/password sign up
- [x] Email/password sign in
- [x] Automatic account linking (anonymous → email)
- [x] Sign out
- [x] Password reset via email
- [x] User profile management

**UI Components:**
- [x] Profile button (top-right corner)
- [x] Avatar with email initial
- [x] Placeholder icon for anonymous
- [x] Slide-up modal animation
- [x] Sign Up form with validation
- [x] Sign In form
- [x] Password reset form
- [x] Profile view (when authenticated)
- [x] Error messages
- [x] Loading states

**Data Management:**
- [x] Player data persists during linking
- [x] Anonymous progress preserved
- [x] Firebase sync after authentication
- [x] Local data remains after sign out
- [x] Firestore security rules active

**Error Handling:**
- [x] Email validation (format check)
- [x] Password validation (min 8 chars)
- [x] Password confirmation match
- [x] Email already in use
- [x] Wrong password
- [x] Network errors
- [x] User-friendly error messages

## Next Steps

### Immediate Testing:
1. Run app in simulator
2. Test anonymous → email flow
3. Verify account linking works
4. Test sign out/sign in cycle

### Firebase Console Setup:
1. Verify Email/Password authentication enabled
2. Check Firestore rules deployed
3. Monitor authentication users
4. Verify player data sync

### Future Enhancements (Not in this iteration):
- [ ] Sign in with Apple (separate task)
- [ ] Email verification
- [ ] Profile photo upload
- [ ] Account deletion
- [ ] Password strength indicator
- [ ] Remember me checkbox

## Support

If you encounter issues:
1. Check Xcode console for detailed logs
2. Verify Firebase Console settings
3. Test each scenario independently
4. Use debug panel to inspect auth state

## Success Criteria

Authentication system is working correctly when:
- ✅ Anonymous users can play immediately
- ✅ Sign up links anonymous data seamlessly
- ✅ Profile button shows correct state
- ✅ Modal UI is smooth and responsive
- ✅ Errors are clear and actionable
- ✅ All player data is preserved
- ✅ Sign out/sign in cycle works perfectly

**Ready for production testing!** 🎉
