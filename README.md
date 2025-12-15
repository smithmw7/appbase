# Web-First Native Puzzle App Framework

A three-part architecture for building a daily puzzle game with replaceable web content and a stable native iOS container.

## Architecture

```
[ Content (React) ] → [ Typed JS Bridge ] → [ Capacitor Native Container ] → [ iOS / App Store ]
```

### Three-Part System

1. **Content** (`content/`) - React web apps that can be swapped without touching native code
2. **Container** (`container/`) - Capacitor iOS wrapper that provides native capabilities
3. **Pipeline** (`pipeline/`) - Build scripts for parameterized, multi-target builds

## Quick Start

### Prerequisites

- Node.js 18+
- Xcode 15+
- CocoaPods
- Firebase project (for production builds)

### Installation

```bash
npm run install:all
```

### Building a Target

```bash
# Build hello world target
npm run build:hello

# Build debug target
npm run build:debug

# Build main production target
npm run build:main
```

Each build command:
1. Builds the React content app
2. Syncs assets to Capacitor
3. Configures iOS project with target-specific settings

### Development Workflow

1. **Content Development**: Work in `content/hello/`, `content/debug/`, or `content/main/`
2. **Sync to Container**: Run `npm run sync:<target>` to update Capacitor web assets
3. **Native Development**: Work in `container/ios/App/` for native code
4. **Full Build**: Run `npm run build:<target>` for complete build

## Project Structure

- `content/` - React web applications (replaceable)
  - `shared/` - Shared bridge interface and types
  - `hello/` - Minimal smoke-test project
  - `debug/` - Full system control project
  - `main/` - Production puzzle game
- `container/` - Capacitor iOS native wrapper (stable)
  - `ios/` - Xcode project
  - `src/` - Native bridge plugins
- `pipeline/` - Build scripts and configuration
  - `configs/` - Per-target build configurations
  - `scripts/` - Build automation scripts

## Key Features

- **Replaceable Content**: Swap web content without native changes
- **Offline-First**: All gameplay data stored locally
- **Type-Safe Bridge**: TypeScript interface ensures consistency
- **Multiple Build Targets**: One codebase, multiple app variants
- **Native Integrations**: Firebase, AdMob, RevenueCat via Capacitor plugins

## Documentation

- [Content Development Guide](content/README.md)
- [Container Development Guide](container/README.md)
- [Build Pipeline Guide](pipeline/README.md)

## License

Private project - All rights reserved
