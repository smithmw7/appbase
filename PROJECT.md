# Game Puzzle App - Project Overview

## Goal

Build and launch a production-ready iOS puzzle game platform with replaceable web content, featuring the **Word Strike** game as the flagship title. The platform enables rapid deployment of new puzzle games without touching native code.

**Launch Definition:** Ship Word Strike to the iOS App Store with:
- Complete authentication (Apple Sign In, email/password, passwordless)
- Cloud sync via Firebase
- Remote puzzle delivery
- Monetization (ads + IAP)
- Production-ready performance and polish

## Architecture

Three-layer system designed for flexibility and rapid iteration:

```
┌─────────────────────────────────────────┐
│  Content Layer (React + TypeScript)    │  ← Replaceable web apps
│  - Word Strike game logic               │
│  - UI components & styling              │
│  - Game state management                │
└─────────────────────────────────────────┘
              ↕ (Typed Bridge)
┌─────────────────────────────────────────┐
│  Capacitor Bridge (Type-Safe)           │  ← Shared contracts
│  - Bridge interface definitions         │
│  - Plugin method signatures             │
└─────────────────────────────────────────┘
              ↕ (Native Plugins)
┌─────────────────────────────────────────┐
│  iOS Container (Swift + Capacitor)      │  ← Native capabilities
│  - GameBridge, AdMob, IAP, Storage      │
│  - Firebase integration                 │
│  - Apple/Google Sign In                 │
└─────────────────────────────────────────┘
```

**Key Insight:** Swap content apps without rebuilding the iOS container. Each game is a standalone Vite project compiled to static assets.

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript 5** - Type safety across web and native boundaries
- **Vite** - Fast development and optimized production builds
- **Tailwind CSS** - Utility-first styling

### Native iOS
- **Capacitor 7** - Web-to-native bridge
- **Swift** - Native plugin implementation
- **CocoaPods** - Dependency management (25 pods)

### Backend Services
- **Firebase**
  - Authentication (Apple Sign In, email/password, email link)
  - Firestore (cloud sync for user data, puzzles, stats)
  - Remote Config (dynamic puzzle delivery, feature flags)
  - Analytics
  - Hosting (puzzle JSON delivery)

### Monetization
- **Google AdMob** - Interstitial ads with frequency capping
- **RevenueCat** - In-app purchases ("Remove Ads")
- **App Tracking Transparency (ATT)** - IDFA compliance

### Build & Deploy
- **npm workspaces** - Monorepo management
- **Custom build pipeline** - Config-driven multi-target builds
- **Firebase CLI** - Remote config deployment

## Key Features

### Word Strike Game
- Drag-and-drop tile mechanics for word building
- Puzzle bank system with difficulty progression
- Endless mode for continuous play
- Custom puzzle creation and sharing
- Audio feedback (tile pickup/release, word validation, win states)
- Cloud sync for progress and stats

### Authentication (NYT-Style)
- **Multi-step guided flow**
  - Step 1: Email entry + provider buttons
  - Step 2: Dynamic UI (create account vs. welcome back)
- **Sign-in methods:**
  - Apple Sign In (native, black button)
  - Google Sign In (placeholder, ready for integration)
  - Email/password
  - Passwordless email link (one-time code)
- **Email detection** - Automatically shows correct flow for new/returning users
- **Anonymous account linking** - Preserves guest progress on sign-up

### Remote Content System
- Puzzle delivery via Firebase Hosting + Remote Config
- Version-controlled puzzle packs (puzzles-v1.0.0.json)
- Client-side caching for offline play
- Dynamic difficulty adjustment

### Native Plugins
- **GameBridge** - App info, entitlements, haptics, audio control, analytics
- **AdMob** - Interstitial ads with entitlement checks
- **IAP** - RevenueCat integration for purchase flows
- **LocalStorage** - SQLite database for puzzles, stats, settings

## Project Structure

```
.
├── PROJECT.md                      # This file
├── LAUNCH_TASKS.md                 # Launch milestones + docs index
├── docs/                           # All documentation (see docs/README.md)
├── content/                        # Web apps (React + Vite)
│   ├── shared/                     # Typed bridge interface
│   └── word-strike/                # Word Strike game
├── container/                      # Capacitor iOS project
│   ├── ios/App/App/                # Native plugins (Swift)
│   └── src/plugins/                # TypeScript plugin definitions
├── pipeline/                       # Build automation
│   ├── scripts/                    # Build, sync, configure scripts
│   └── configs/                    # Per-target configurations
├── public/                         # Static assets (puzzles, hosting)
└── resources/                      # App icons, audio, music
```

## How to Build & Run

### Prerequisites
- Node.js 18+
- Xcode 15+ (macOS only)
- iOS device or simulator
- Firebase project configured

### Quick Start
```bash
# Install all dependencies
npm run install:all

# Build Word Strike target
npm run build:word-strike

# Open in Xcode
cd container && npx cap open ios
```

### Build Pipeline
The build process is fully automated:
1. **Content build** - Compile React app to static assets
2. **Capacitor sync** - Copy web assets to iOS project
3. **iOS configuration** - Apply target-specific settings (bundle ID, Firebase, ads)

**See:** [docs/setup/](docs/setup/) for detailed setup guides

## Current Status

✅ **Complete:**
- Project structure and build pipeline
- iOS container with all native plugins
- Firebase integration (auth, Firestore, Remote Config)
- NYT-style authentication flow (all methods)
- Word Strike game (fully playable)
- Remote puzzle delivery system

⚠️ **In Progress:**
- AdMob integration (files ready, needs console setup)
- RevenueCat IAP (files ready, needs console setup)
- Production testing and polish
- App Store submission preparation

## Documentation

- **[Launch Tasks](LAUNCH_TASKS.md)** - What's needed to ship + docs governance
- **[Documentation Index](docs/README.md)** - Full docs catalog by category
- **Setup Guides** - [docs/setup/](docs/setup/)
- **iOS Configuration** - [docs/ios/](docs/ios/)
- **Authentication** - [docs/auth/](docs/auth/)
- **Firebase** - [docs/firebase/](docs/firebase/)

## Key Decisions & Patterns

### Why Capacitor?
- Native performance for web content
- Full access to iOS APIs via plugins
- Smaller bundle than Electron/React Native for our use case
- Hot reload during development

### Why Firebase?
- Generous free tier for indie development
- Unified auth, database, analytics, and hosting
- Remote Config enables dynamic content delivery
- No backend code to maintain

### Why Type-Safe Bridge?
- Catch interface mismatches at compile time
- Enables confident refactoring across web/native boundary
- Self-documenting plugin contracts

### Why Monorepo?
- Single source of truth for dependencies
- Shared TypeScript configs and build tools
- Atomic commits across content and container
- Simplified CI/CD

---

**Ready to contribute?** Start with [LAUNCH_TASKS.md](LAUNCH_TASKS.md) to see what's next.


