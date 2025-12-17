# NYT-Style Authentication - Quick Reference

## All 8 Todos Completed

The NYT-style authentication flow has been fully implemented with:
- Multi-step email flow
- Email detection (new vs returning users)
- One-time code authentication
- Apple Sign In (positioned first)
- Google Sign In placeholder
- Automatic anonymous account linking

## What You'll See

### Step 1: Initial Screen

Tap the profile button to see:

```
Continue with Apple        ← Black button, Apple logo
Continue with Google       ← White button, Google logo (placeholder)

──────── or ────────

Email address
[                    ]     ← Input field

[     Continue      ]      ← Dark button
```

### Step 2A: New Email (Create Account)

If email doesn't exist:

```
Email address
your@email.com   [Edit]   ← Can go back

Password
[                    ]

Confirm password
[                    ]

[   Create account  ]
```

### Step 2B: Existing Email (Welcome Back)

If email exists in Firebase:

```
Email address  
existing@email.com [Edit]  ← Can go back

Enter your password to log in.

Password
[                    ]

Forgot your password?      ← Underlined link

[      Log in       ]      ← Dark button

[ Email me a one-time code ] ← Outlined button
```

### Email Sent Screen

After requesting one-time code:

```
       📧

Check your email

We've sent a sign-in link to
your@email.com. Click the 
link to continue.

Back to sign in
```

## How Each Flow Works

### Apple Sign In
```
Tap "Continue with Apple"
  ↓
iOS system prompt
  ↓
Authenticate (Face ID / Touch ID)
  ↓
Account linked (if anonymous)
  ↓
Profile button turns purple
```

### Email/Password (New User)
```
Enter email → Continue
  ↓
System checks Firebase
  ↓
Email not found
  ↓
Show "Create account" screen
  ↓
Enter password twice
  ↓
Create account
  ↓
Anonymous account linked
```

### Email/Password (Returning User)
```
Enter email → Continue
  ↓
System checks Firebase
  ↓
Email found!
  ↓
Show "Welcome back" screen
  ↓
Enter password
  ↓
Log in
  ↓
Load data from Firebase
```

### One-Time Code
```
"Welcome back" screen
  ↓
Tap "Email me a one-time code"
  ↓
Email sent to user
  ↓
User checks inbox
  ↓
Click link in email
  ↓
App opens (or already open)
  ↓
Auto-authenticates
  ↓
Anonymous account linked (if applicable)
```

## Firebase Console Setup

### Required: Enable Email Link Auth

1. Go to: https://console.firebase.google.com/project/com-hightopgames-firebase/authentication/providers
2. Click "Email/Password"
3. Toggle ON: "Email link (passwordless sign-in)"
4. Click Save

That's it! No other configuration needed.

## Testing on Device

### Prerequisites

- [ ] Xcode setup completed (see [../ios/apple-signin-xcode-setup.md](../ios/apple-signin-xcode-setup.md))
- [ ] Physical device connected
- [ ] Email link enabled in Firebase Console
- [ ] Build #31 installed on device

### Quick Test Flow

**Test 1: New User**
```
1. Enter: newuser@test.com
2. See "Create account" screen ✓
3. Create password
4. Account created and linked ✓
```

**Test 2: Existing User**
```
1. Enter: newuser@test.com (from Test 1)
2. See "Welcome back" screen ✓
3. Enter password
4. Log in successful ✓
```

**Test 3: One-Time Code**
```
1. Enter existing email
2. Tap "Email me a one-time code"
3. Check inbox ✓
4. Click link
5. App authenticates ✓
```

**Test 4: Apple**
```
1. Tap "Continue with Apple"
2. iOS prompt ✓
3. Authenticate
4. Account linked ✓
```

## Common Issues

**"Email link authentication failed"**
- Check email link is enabled in Firebase
- Verify action URL is correct
- Ensure email was stored in localStorage

**"No email found in storage"**
- User may have cleared browser/app data
- Normal for first-time email link
- User can re-enter email

**"Continue with Google" does nothing**
- Expected behavior (placeholder)
- Will be implemented in future update

**Apple Sign In errors**
- Complete Xcode setup steps first
- Ensure entitlements file is linked
- Test on physical device only

## Build Information

- **Build Number:** 31
- **Bundle ID:** com.hightopgames.word (fixed)
- **Status:** Build succeeded
- **Xcode:** Open and ready

## Documentation Files

- **This File:** Quick reference
- **[nyt-auth-implementation.md](nyt-auth-implementation.md):** Full details
- **[../ios/apple-signin-xcode-setup.md](../ios/apple-signin-xcode-setup.md):** Xcode configuration steps
- **[../ios/apple-signin-testing.md](../ios/apple-signin-testing.md):** Apple-specific testing

## Ready to Test!

The NYT-style authentication is fully implemented and ready for device testing. Complete the Xcode setup steps, then test on your iPhone!
