# Plugin Architecture - Why We Write Custom Plugins

## The Architecture

```
[ React Content ] 
    ↓ (calls)
[ Bridge Interface (TypeScript) ]
    ↓ (via Capacitor)
[ Custom Swift Plugins ]
    ↓ (use)
[ Native SDKs: Firebase, AdMob, RevenueCat, SQLite ]
```

## Why Custom Plugins?

### Official Plugins vs Custom Plugins

**Official Capacitor Plugins** (from npm):
- `@capacitor/haptics` ✅ - Generic haptic feedback
- `@capacitor/app` ✅ - Generic app info
- `@capacitor/preferences` ✅ - Generic key-value storage

**Our Custom Plugins** (we write):
- `GameBridgePlugin` - **Combines multiple features** into one unified bridge
- `AdMobPlugin` - **Wraps AdMob** with our specific logic (entitlement checks, frequency capping)
- `IAPPlugin` - **Wraps RevenueCat** with our specific product ("Remove Ads")
- `LocalStoragePlugin` - **Custom SQLite schema** for our specific data (puzzles, stats, settings)

## Why Not Use Official Plugins Directly?

### Example: Why GameBridgePlugin Instead of Individual Plugins

**If we used official plugins directly:**
```typescript
// Content would need to know about multiple plugins
import { Haptics } from '@capacitor/haptics';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
// Plus custom logic for ads, IAP, etc.
```

**With our GameBridgePlugin:**
```typescript
// Content only knows about ONE interface
import { bridge } from '@shared/bridge';
bridge.haptic('success');
bridge.getAppInfo();
bridge.showInterstitialAd();
```

**Benefits:**
- ✅ Content doesn't need to know about native implementation details
- ✅ We can swap implementations without changing content
- ✅ Single source of truth for the bridge contract
- ✅ Matches the PRD requirement: "Content must never depend on concrete implementation"

## Plugin File Structure

### Standard Capacitor Plugin Pattern

Each plugin needs:

1. **Swift Implementation** (`PluginName.swift`)
   ```swift
   @objc(PluginName)
   public class PluginName: CAPPlugin {
       @objc func methodName(_ call: CAPPluginCall) {
           // Implementation
       }
   }
   ```

2. **Objective-C Bridge** (`PluginName.m`)
   ```objc
   CAP_PLUGIN(PluginName, "PluginName",
       CAP_PLUGIN_METHOD(methodName, CAPPluginReturnPromise);
   )
   ```

3. **TypeScript Definitions** (already in `container/src/plugins/`)
   - Defines the interface for TypeScript/JavaScript

## Why These Files Aren't "Downloaded"

These are **custom implementations** that:
- Wrap third-party SDKs (Firebase, AdMob, RevenueCat) with our specific logic
- Implement our specific bridge contract
- Handle our specific data structures (puzzle schema, stats, etc.)

They're **not available as npm packages** because they're app-specific.

## Best Practice Confirmation

✅ **Writing custom plugins directly in the iOS project is:**
- Standard practice for app-specific functionality
- Recommended by Capacitor documentation for in-app plugins
- What most Capacitor apps do for custom functionality
- The correct approach for our architecture

✅ **Using `npx cap plugin:generate` would be:**
- Overkill for app-specific code
- Better suited for reusable/open-source plugins
- More complex than needed

## Conclusion

**Recreating these plugin files is the correct approach.** They're custom code we write, not something we download. This is standard Capacitor development practice.
