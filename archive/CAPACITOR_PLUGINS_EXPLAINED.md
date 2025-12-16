# Capacitor Plugins - Best Practices Explained

## Two Types of Plugins

### 1. Official Capacitor Plugins (Already Installed) ✅

These come from npm packages and are **automatically downloaded and registered**:

- `@capacitor/app` - App lifecycle
- `@capacitor/device` - Device info
- `@capacitor/haptics` - Haptic feedback
- `@capacitor/preferences` - Key-value storage
- `@capacitor-community/sqlite` - SQLite database

**These are already working** - no additional setup needed!

### 2. Custom Plugins (What We Need to Create)

These are **app-specific plugins** you write yourself. They are **NOT downloaded** - you create them.

## Two Approaches for Custom Plugins

### Approach A: In-App Plugins (What We're Doing) ✅ Recommended

**Best for:** App-specific functionality that won't be reused

**How it works:**
- Write Swift files directly in `container/ios/App/App/`
- Create Objective-C bridge files (`.m`) for Capacitor registration
- Add files to Xcode project
- Register in Capacitor

**Pros:**
- Simple and straightforward
- No extra build steps
- Perfect for app-specific code
- Standard practice for most apps

**Cons:**
- Not reusable across projects
- Tied to this specific app

**This is what we're doing** - and it's the correct approach for our use case!

### Approach B: Standalone Plugin Packages (Alternative)

**Best for:** Reusable plugins you might publish or use in multiple projects

**How it works:**
```bash
npx cap plugin:generate
# Creates a separate plugin package
# Then install it: npm install ./path/to/plugin
```

**Pros:**
- Reusable across projects
- Can be published to npm
- Better for open-source plugins

**Cons:**
- More complex setup
- Overkill for app-specific functionality
- Extra build steps

## Why We're Using In-App Plugins

Our plugins are:
- **App-specific** - GameBridge, custom AdMob wrapper, custom IAP wrapper
- **Not reusable** - They're designed for this specific app architecture
- **Tightly integrated** - They work with our specific Firebase setup, Remote Config keys, etc.

**Therefore, in-app plugins are the correct choice.**

## What Happened to Our Plugin Files?

When we ran `npx cap add ios` to recreate the iOS project, it:
1. Created a fresh iOS project structure
2. Only included Capacitor's default files
3. **Didn't include our custom plugin files** (because they're custom, not part of Capacitor)

This is **normal and expected**. Custom files need to be re-added after iOS project recreation.

## Best Practice Summary

✅ **What we're doing is correct:**
- Writing custom Swift plugins directly in the iOS project
- These are app-specific, not meant to be reused
- This is standard practice for most Capacitor apps

❌ **Not recommended for our case:**
- Using `npx cap plugin:generate` (overkill for app-specific code)
- Expecting plugins to be "downloaded" (they're custom code we write)

## What Needs to Happen

1. **Create the plugin Swift files** - I write them based on our TypeScript definitions
2. **Add to Xcode** - You drag them into the Xcode project
3. **Register in Capacitor** - The `.m` bridge files handle this automatically

This is the standard workflow for custom Capacitor plugins!
