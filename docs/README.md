# Documentation Index

Welcome to the project documentation. This directory contains all non-core documentation organized by category.

## Quick Links

- [Project Overview](../PROJECT.md) - Goals, architecture, tech stack
- [Launch Tasks](../LAUNCH_TASKS.md) - Top-level tasks to ship + docs governance

## Documentation Categories

### Setup & Development
**Location:** `docs/setup/`
- Build pipeline, installation, testing guides, and deployment procedures

### iOS Native
**Location:** `docs/ios/`
- Xcode configuration, entitlements, Apple Sign In setup and testing

### Authentication
**Location:** `docs/auth/`
- NYT-style auth flow implementation, testing guides, and quick references

### Firebase
**Location:** `docs/firebase/`
- Firebase setup, verification, and remote config documentation

### Specifications
**Location:** `docs/specs/`
- Data formats, schemas, and technical specifications (e.g., puzzle JSON format)

### Planning
**Location:** `docs/planning/`
- `active/` - Current planning documents in use
- `archive/` - Completed/obsolete planning documents

### Legacy
**Location:** `docs/legacy/`
- Historical documentation from early development phases
- Kept for reference; may be merged/curated over time

## Documentation Lifecycle

All documentation follows the lifecycle defined in [LAUNCH_TASKS.md](../LAUNCH_TASKS.md):

1. **New planning docs** are created in `docs/planning/active/` and registered in LAUNCH_TASKS.md
2. **After use**, they are moved to `docs/planning/archive/` and marked as archived
3. **Technical docs** live in their respective category folders and are indexed in LAUNCH_TASKS.md
4. **Root contains only** PROJECT.md and LAUNCH_TASKS.md

---

*For the authoritative documentation index and cleanup rules, see [LAUNCH_TASKS.md](../LAUNCH_TASKS.md)*


