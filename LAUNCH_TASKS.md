# Launch Tasks - Word Strike iOS

**Single source of truth for shipping Word Strike to the App Store.**

## What is "Launch"?

Launch means Word Strike is live on the iOS App Store with:

- ✅ **Platform:** iOS 15+ (iPhone & iPad)
- ✅ **Must-Have Features:**
  - Complete authentication (Apple Sign In, email/password, passwordless)
  - Cloud sync for user progress, stats, and puzzles
  - Remote puzzle delivery with caching
  - Core gameplay (drag-and-drop word building, win detection, audio feedback)
  - Profile system with avatar and username
- ⚠️ **Monetization:**
  - AdMob interstitial ads (console setup pending)
  - "Remove Ads" IAP via RevenueCat (console setup pending)
- ✅ **Quality Bar:**
  - No critical bugs
  - Smooth performance (60fps gameplay)
  - Professional UI/UX matching NYT Games polish
  - All auth flows tested on physical device
  - Offline functionality for cached puzzles

**Target:** v1.0.0 submitted to App Store Connect

---

## Launch Milestones & Tasks

### Milestone 1: Core Infrastructure ✅
**Status:** Complete

- [x] **1.1** Set up monorepo structure (content/container/pipeline)
- [x] **1.2** Configure build pipeline with multi-target support
- [x] **1.3** Create typed bridge interface between web and native
- [x] **1.4** Implement all native plugins (GameBridge, AdMob, IAP, LocalStorage)
- [x] **1.5** Configure Firebase project and integrate SDK
- [x] **1.6** Set up npm workspaces and dependency management

**Docs:** [docs/setup/](docs/setup/), [docs/firebase/firebase-setup.md](docs/firebase/firebase-setup.md)

### Milestone 2: iOS Container Setup ✅
**Status:** Complete

- [x] **2.1** Initialize Capacitor iOS project
- [x] **2.2** Install CocoaPods dependencies
- [x] **2.3** Configure Xcode workspace and build settings
- [x] **2.4** Set correct bundle ID (`com.hightopgames.word`)
- [x] **2.5** Add App.entitlements with Sign in with Apple capability
- [x] **2.6** Configure GoogleService-Info.plist for Firebase

**Docs:** [docs/ios/](docs/ios/), [docs/firebase/firebase-verification.md](docs/firebase/firebase-verification.md)

### Milestone 3: Authentication System ✅
**Status:** Complete - Verified in Build #32

- [x] **3.1** Implement Apple Sign In (native)
  - [x] Native Swift implementation in FirebaseManager
  - [x] Capacitor bridge to JavaScript
  - [x] UI button (black, positioned first)
  - [x] Anonymous account linking
- [x] **3.2** Implement email/password authentication
  - [x] Create account flow with password validation
  - [x] Login flow with "welcome back" UX
  - [x] Email detection using `fetchSignInMethods()`
- [x] **3.3** Implement passwordless email link auth
  - [x] `sendSignInLink()` method
  - [x] `signInWithEmailLink()` with deep link handling
  - [x] Email localStorage persistence
  - [x] Auto-linking for anonymous accounts
- [x] **3.4** Build NYT-style multi-step UI
  - [x] Step 1: Email entry + provider buttons
  - [x] Step 2: Dynamic form (create vs. login)
  - [x] Edit email functionality
  - [x] Professional error handling and loading states
- [x] **3.5** Implement profile system
  - [x] Profile modal with avatar and username display
  - [x] Sign out functionality

**Docs:** [docs/auth/](docs/auth/)
- [docs/auth/nyt-auth-implementation.md](docs/auth/nyt-auth-implementation.md)
- [docs/auth/auth-implementation-summary.md](docs/auth/auth-implementation-summary.md)
- [docs/auth/auth-testing-guide.md](docs/auth/auth-testing-guide.md)
- [docs/auth/nyt-auth-quick-reference.md](docs/auth/nyt-auth-quick-reference.md)

**Apple Sign In Docs:** [docs/ios/](docs/ios/)
- [docs/ios/apple-signin-implementation.md](docs/ios/apple-signin-implementation.md)
- [docs/ios/apple-signin-xcode-setup.md](docs/ios/apple-signin-xcode-setup.md)
- [docs/ios/apple-signin-quickstart.md](docs/ios/apple-signin-quickstart.md)
- [docs/ios/apple-signin-testing.md](docs/ios/apple-signin-testing.md)

### Milestone 4: Word Strike Game ✅
**Status:** Complete

- [x] **4.1** Implement drag-and-drop tile mechanics
- [x] **4.2** Build puzzle data structures and validation
- [x] **4.3** Create game state management (PlayerDataManager, PuzzleDataManager)
- [x] **4.4** Implement audio system (tile sounds, word validation, win states)
- [x] **4.5** Build UI components (game board, tile grid, controls)
- [x] **4.6** Add endless mode functionality
- [x] **4.7** Implement custom puzzle creation

**Docs:** [docs/specs/puzzle-json-format.md](docs/specs/puzzle-json-format.md)

### Milestone 5: Remote Content System ✅
**Status:** Complete

- [x] **5.1** Design puzzle JSON format (v1.0.0)
- [x] **5.2** Configure Firebase Hosting for puzzle delivery
- [x] **5.3** Set up Firebase Remote Config with puzzle URLs
- [x] **5.4** Implement RemotePuzzleLoader with caching
- [x] **5.5** Create deployment script for puzzle publishing
- [x] **5.6** Test remote puzzle loading and offline fallback

**Docs:** 
- [docs/firebase/remote-puzzle-config.md](docs/firebase/remote-puzzle-config.md)
- [docs/specs/puzzle-json-format.md](docs/specs/puzzle-json-format.md)

### Milestone 6: Monetization Setup ⚠️
**Status:** Implementation complete, console setup pending

- [x] **6.1** Implement AdMob plugin (Swift + bridge)
- [x] **6.2** Add interstitial ad logic with frequency capping
- [x] **6.3** Implement ATT (App Tracking Transparency) flow
- [x] **6.4** Implement IAP plugin via RevenueCat
- [x] **6.5** Add "Remove Ads" purchase flow
- [ ] **6.6** ⚠️ **BLOCKED:** Create AdMob app and ad units in console
- [ ] **6.7** ⚠️ **BLOCKED:** Configure RevenueCat project and products
- [ ] **6.8** Test ad display and purchase flows on device

**Next Actions:**
1. Create app in AdMob Console → get GADApplicationIdentifier
2. Create interstitial ad unit → get GADInterstitialAdUnitID
3. Update `pipeline/configs/word-strike.json` with ad IDs
4. Create RevenueCat project → get RevenueCatAPIKey
5. Add "Remove Ads" product → get RemoveAdsProductID
6. Uncomment RevenueCat pod in Podfile → run `pod install`

### Milestone 7: Testing & Polish 🔄
**Status:** In progress

- [x] **7.1** Test authentication flows on physical device
  - [x] Apple Sign In
  - [x] Email/password (create + login)
  - [x] Passwordless email link
  - [x] Anonymous account linking
- [x] **7.2** Verify Firebase integration
  - [x] Analytics events
  - [x] Remote Config loading
  - [x] Firestore cloud sync
- [ ] **7.3** Test game performance (target 60fps)
- [ ] **7.4** Test offline functionality
  - [ ] Cached puzzles playable offline
  - [ ] Progress syncs when back online
- [ ] **7.5** UI/UX polish pass
  - [ ] Smooth animations and transitions
  - [ ] Loading states for all async operations
  - [ ] Error handling and user feedback
- [ ] **7.6** Audio testing (all sound effects and music)
- [ ] **7.7** Cross-device testing (iPhone sizes, iPad)

**Docs:** 
- [docs/setup/testing-guide.md](docs/setup/testing-guide.md)
- [docs/auth/auth-testing-guide.md](docs/auth/auth-testing-guide.md)

### Milestone 8: App Store Submission 📋
**Status:** Not started

- [ ] **8.1** Prepare App Store Connect listing
  - [ ] App name, description, keywords
  - [ ] Screenshots (all required device sizes)
  - [ ] Privacy policy URL
  - [ ] Support URL
- [ ] **8.2** Configure app metadata
  - [ ] Version number (1.0.0)
  - [ ] Build number
  - [ ] Category (Games > Word)
  - [ ] Age rating
- [ ] **8.3** Set up TestFlight for beta testing
- [ ] **8.4** Submit for App Review
- [ ] **8.5** Address any review feedback
- [ ] **8.6** Release to App Store

---

## Documentation Governance

**LAUNCH_TASKS.md is the authoritative index for all project documentation.**

### Core Principle
The root directory contains **only two markdown files:**
1. `PROJECT.md` - Project overview (goals, stack, architecture)
2. `LAUNCH_TASKS.md` - This file (tasks + docs index)

All other documentation lives in `docs/` and must be registered in the **Docs Index** below.

### Documentation Lifecycle Rules

#### Creating New Documentation

**Technical/Reference Docs:**
1. Create in the appropriate `docs/` category folder:
   - `docs/setup/` - Build, install, deploy guides
   - `docs/ios/` - Xcode, native iOS configuration
   - `docs/auth/` - Authentication implementation
   - `docs/firebase/` - Firebase setup and config
   - `docs/specs/` - Data formats and specifications
   - `docs/legacy/` - Historical/archived content
2. Add an entry to the **Docs Index** section below
3. Link from relevant milestone tasks above

**Planning Docs:**
1. Create in `docs/planning/active/`
2. Use filename format: `YYYY-MM-DD_topic.md`
3. Immediately register in **Docs Index** with:
   - Title, path, created date, owner, related task(s)
4. Update status as work progresses

#### Archiving Documentation

**When a planning doc is completed/obsolete:**
1. Move from `docs/planning/active/` → `docs/planning/archive/`
2. Update its Docs Index entry:
   - Change status to `Archived`
   - Add archive date
   - Add outcome/notes

**When technical docs become outdated:**
1. Move to `docs/legacy/` or delete if superseded
2. Update Docs Index entry to `Legacy` status
3. Update any links in active docs

### Enforcement Process

1. **Before creating a new .md file:** Check if it belongs in an existing doc category
2. **After creating a new .md file:** Immediately add it to the Docs Index below
3. **Weekly cleanup:** Review active planning docs, archive completed ones
4. **Monthly audit:** Review all docs, merge/delete redundant content

---

## Docs Index

**All project documentation registered here. Status: Active | Archived | Legacy**

### Core Documents
| Document | Path | Status | Last Updated |
|----------|------|--------|--------------|
| Project Overview | `PROJECT.md` | Active | 2024-12-17 |
| Launch Tasks & Docs Index | `LAUNCH_TASKS.md` | Active | 2024-12-17 |
| Documentation Index | `docs/README.md` | Active | 2024-12-17 |

### Setup & Development
| Document | Path | Status | Purpose |
|----------|------|--------|---------|
| Testing Guide | `docs/setup/testing-guide.md` | Active | End-to-end testing procedures |

### iOS Native
| Document | Path | Status | Purpose |
|----------|------|--------|---------|
| Apple Sign In Implementation | `docs/ios/apple-signin-implementation.md` | Active | Complete Apple Sign In technical details |
| Apple Sign In Xcode Setup | `docs/ios/apple-signin-xcode-setup.md` | Active | Step-by-step Xcode configuration |
| Apple Sign In Quick Start | `docs/ios/apple-signin-quickstart.md` | Active | Quick reference for Apple Sign In |
| Apple Sign In Testing | `docs/ios/apple-signin-testing.md` | Active | Testing procedures for Apple Sign In |

### Authentication
| Document | Path | Status | Purpose |
|----------|------|--------|---------|
| NYT Auth Implementation | `docs/auth/nyt-auth-implementation.md` | Active | Complete NYT-style auth technical details |
| Auth Implementation Summary | `docs/auth/auth-implementation-summary.md` | Active | High-level auth system overview |
| Auth Testing Guide | `docs/auth/auth-testing-guide.md` | Active | Authentication testing procedures |
| NYT Auth Quick Reference | `docs/auth/nyt-auth-quick-reference.md` | Active | Quick reference for auth flows |

### Firebase
| Document | Path | Status | Purpose |
|----------|------|--------|---------|
| Firebase Setup | `docs/firebase/firebase-setup.md` | Active | Initial Firebase project configuration |
| Firebase Verification | `docs/firebase/firebase-verification.md` | Active | Verification and testing procedures |
| Remote Puzzle Config | `docs/firebase/remote-puzzle-config.md` | Active | Remote Config setup for puzzle delivery |

### Specifications
| Document | Path | Status | Purpose |
|----------|------|--------|---------|
| Puzzle JSON Format | `docs/specs/puzzle-json-format.md` | Active | v1.0.0 puzzle data format specification |

### Planning Documents
| Document | Path | Status | Created | Owner | Related Task |
|----------|------|--------|---------|-------|--------------|
| *(Planning docs will be registered here)* | - | - | - | - | - |

### Legacy Documents
| Document | Path | Status | Notes |
|----------|------|--------|-------|
| Project Recap | `docs/legacy/PROJECT_RECAP.md` | Legacy | Early project setup summary |
| Setup Guide | `docs/legacy/SETUP.md` | Legacy | Original setup instructions |
| Setup Next Steps | `docs/legacy/SETUP_NEXT_STEPS.md` | Legacy | Early development tasks |
| Next Steps | `docs/legacy/NEXT_STEPS.md` | Legacy | Original task list |
| iOS Setup Complete | `docs/legacy/IOS_SETUP_COMPLETE.md` | Legacy | Initial iOS configuration |
| iOS Setup Status | `docs/legacy/IOS_SETUP_STATUS.md` | Legacy | iOS setup checklist |
| Capacitor Plugins Explained | `docs/legacy/CAPACITOR_PLUGINS_EXPLAINED.md` | Legacy | Plugin architecture overview |
| Plugin Architecture | `docs/legacy/PLUGIN_ARCHITECTURE.md` | Legacy | Original plugin design doc |
| Firebase CLI Setup | `docs/legacy/FIREBASE_CLI_SETUP.md` | Legacy | Firebase CLI installation |
| Production Build | `docs/legacy/PRODUCTION_BUILD.md` | Legacy | Build configuration notes |
| Startup Performance | `docs/legacy/STARTUP_PERFORMANCE.md` | Legacy | Performance optimization notes |
| README (plugins) | `docs/legacy/README_plugins.md` | Legacy | Plugin usage examples |
| README (original) | `docs/legacy/README.md` | Legacy | AI Studio template README |

---

## Quick Reference

### Most Recent Accomplishments
- ✅ NYT-style authentication fully implemented (Build #32)
- ✅ All auth methods working: Apple, email/password, passwordless
- ✅ Email detection for new vs. returning users
- ✅ Anonymous account linking for all auth methods
- ✅ Profile system with avatar and username
- ✅ Remote puzzle delivery with Firebase Hosting + Remote Config

### Immediate Next Steps
1. **Complete monetization setup** (Milestone 6.6-6.8)
   - Create AdMob app and ad unit
   - Configure RevenueCat project
   - Test on physical device
2. **Polish and testing** (Milestone 7.3-7.7)
   - Performance optimization
   - Offline functionality verification
   - UI/UX polish pass
3. **Prepare for App Store** (Milestone 8)
   - App Store Connect listing
   - Screenshots and metadata
   - TestFlight beta testing

### Key Commands
```bash
# Build Word Strike
npm run build:word-strike

# Open in Xcode
cd container && npx cap open ios

# Deploy puzzles to Firebase
./scripts/deploy-puzzles.sh

# Publish Remote Config
npm run firebase:deploy-remoteconfig
```

---

**For project overview and architecture details, see [PROJECT.md](PROJECT.md)**

**For full documentation catalog, see [docs/README.md](docs/README.md)**


