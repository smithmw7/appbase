# Custom Plugins - Add to Xcode

These files were recreated for the iOS project. Add them to the Xcode project (`App` target) so Capacitor can register them:

- `GameBridgePlugin.swift` / `GameBridgePlugin.m`
- `AdMobPlugin.swift` / `AdMobPlugin.m`
- `IAPPlugin.swift` / `IAPPlugin.m`
- `LocalStoragePlugin.swift` / `LocalStoragePlugin.m`
- `FirebaseManager.swift` (singleton; bridge file optional)

How to add:
1) Open Xcode: `cd container && npx cap open ios`
2) In Xcode, right-click the `App` folder → “Add Files to App…”
3) Select all the files above from `container/ios/App/App/`
4) Check “Copy items if needed”
5) Ensure “App” target is selected
6) Click Add

Important:
- Choose **“Don’t Create”** if Xcode prompts for a bridging header. The `.m` files only register plugins; no bridging header is needed.
- If you already created a bridging header, it’s okay—just keep it; it won’t hurt.

After adding, build in Xcode (⌘R).
