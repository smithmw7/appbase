# Build Pipeline

The build pipeline provides parameterized, multi-target builds for the puzzle app framework.

## Configuration

Each build target has a JSON configuration file in `pipeline/configs/`:

- `hello.json` - Hello world smoke-test target
- `debug.json` - Debug target with full system control
- `main.json` - Production puzzle game target

### Configuration Schema

```json
{
  "bundleId": "com.puzzleapp.hello",
  "appName": "Puzzle App Hello",
  "iconPath": "pipeline/assets/icons/hello",
  "contentDir": "content/hello",
  "firebaseConfig": "container/ios/App/App/GoogleService-Info.plist",
  "enableAds": false,
  "adUnitId": "ca-app-pub-...",
  "revenueCatApiKey": "...",
  "removeAdsProductId": "..."
}
```

## Build Scripts

### build-content.js

Builds a React content project:

```bash
node pipeline/scripts/build-content.js <target>
```

- Changes to content directory
- Runs `npm run build`
- Outputs to `content/<target>/dist/`

### sync-capacitor.js

Syncs built web assets to Capacitor:

```bash
node pipeline/scripts/sync-capacitor.js <target>
```

- Copies `content/<target>/dist/` to `container/public/`
- Runs `npx cap sync ios`

### configure-ios.js

Configures iOS project with target-specific settings:

```bash
node pipeline/scripts/configure-ios.js <target>
```

- Updates `capacitor.config.ts` (appId, appName)
- Updates `Info.plist` (bundle ID, app name, ad unit IDs, etc.)
- Copies Firebase config file

### build-all.js

Orchestrates full build process:

```bash
node pipeline/scripts/build-all.js <target>
```

Runs all three scripts in sequence.

## Usage

From project root:

```bash
# Build hello world target
npm run build:hello

# Build debug target
npm run build:debug

# Build main production target
npm run build:main
```

## Adding New Targets

1. Create config file: `pipeline/configs/<target>.json`
2. Add build script to root `package.json`:
   ```json
   "build:<target>": "node pipeline/scripts/build-all.js <target>"
   ```
3. Create content project in `content/<target>/` (if needed)

## Environment Variables

Build scripts use Node.js standard libraries. No additional environment setup required.
