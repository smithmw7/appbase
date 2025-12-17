# Puzzle JSON Format

## Structure with Version Metadata

Your `puzzles.json` file should now include version metadata at the top:

```json
{
  "version": "1.0.0",
  "createdAt": "2024-12-16T00:00:00Z",
  "description": "Initial puzzle pack with 100 5-letter word puzzles",
  "puzzleCount": 100,
  "rackSizes": [5],
  "puzzles": [
    {
      "start": "about",
      "rack": ["e", "n", "s", "h", "r"],
      "S_4": [
        ["abort", "snort", "short", "shore"]
      ],
      "C_S_4": 1
    },
    // ... more puzzles
  ]
}
```

## Metadata Fields

### Required
- **puzzles** (array) - Array of puzzle objects

### Optional but Recommended
- **version** (string) - Semantic version (e.g., "1.0.0", "2.1.0")
- **createdAt** (string) - ISO timestamp when pack was created
- **description** (string) - Human-readable description
- **puzzleCount** (number) - Total number of puzzles (useful for validation)
- **rackSizes** (array) - Rack sizes included (e.g., [5, 7])

## Why Include Version in JSON?

### 1. Self-Documentation
The file knows its own version, making it easy to identify:
```bash
jq '.version, .description' puzzles.json
# Output:
# "1.0.0"
# "Initial puzzle pack with 100 5-letter word puzzles"
```

### 2. Dual Versioning System
You now have two complementary version systems:

**Content Hash** (for integrity):
- SHA-256 hash of entire JSON content
- Changes if ANY data changes
- Perfect for detecting updates
- Used by app to know when to download

**Semantic Version** (for tracking):
- Human-readable version number
- You control when it changes
- Communicates major/minor/patch changes
- Shown in debug panel

### 3. Additional Validation
The app can validate:
```typescript
// Check if we're loading the expected pack
if (data.version !== "1.0.0") {
  console.warn("Unexpected puzzle pack version");
}

// Verify puzzle count matches
if (data.puzzles.length !== data.puzzleCount) {
  console.error("Puzzle count mismatch");
}
```

### 4. Better Debugging
Debug panel now shows:
```
Pack Version: 1.0.0          ← Your semantic version
Hash: a3f7c2d1...            ← Content hash
Source: remote               ← Where it came from
Count: 100                   ← Number of puzzles
```

## Version Numbering Strategy

Use semantic versioning: `MAJOR.MINOR.PATCH`

### MAJOR (1.0.0 → 2.0.0)
Breaking changes that affect gameplay:
- Change puzzle format
- Add/remove required fields
- Completely new puzzle types

### MINOR (1.0.0 → 1.1.0)
New content, backwards compatible:
- Add 50 new puzzles
- Add 7-letter rack puzzles
- New difficulty levels

### PATCH (1.0.0 → 1.0.1)
Bug fixes or small updates:
- Fix typos in words
- Correct solution paths
- Remove duplicate puzzles

## Example Evolution

**v1.0.0** - Initial release
```json
{
  "version": "1.0.0",
  "description": "Initial puzzle pack with 100 5-letter word puzzles",
  "puzzleCount": 100,
  "rackSizes": [5]
}
```

**v1.1.0** - Added content
```json
{
  "version": "1.1.0",
  "description": "Added 50 new 5-letter puzzles and 30 7-letter puzzles",
  "puzzleCount": 180,
  "rackSizes": [5, 7]
}
```

**v1.1.1** - Bug fix
```json
{
  "version": "1.1.1",
  "description": "Fixed 3 puzzles with invalid solution paths",
  "puzzleCount": 180,
  "rackSizes": [5, 7]
}
```

**v2.0.0** - Major update
```json
{
  "version": "2.0.0",
  "description": "Complete puzzle format overhaul with new scoring system",
  "puzzleCount": 200,
  "rackSizes": [5, 7, 9]
}
```

## Deployment Workflow

### 1. Update puzzles.json
```json
{
  "version": "1.1.0",
  "createdAt": "2024-12-16T10:30:00Z",
  "description": "Added 50 challenging expert-level puzzles",
  "puzzleCount": 150,
  "rackSizes": [5],
  "puzzles": [ /* ... */ ]
}
```

### 2. Deploy to Firebase
```bash
./scripts/deploy-puzzles.sh v1.1.0
```

Output will show:
```
📦 Pack Version: 1.1.0
📝 Description: Added 50 challenging expert-level puzzles
📝 Puzzle URL: https://your-project.web.app/puzzles-v1.1.0.json
🔐 Content Hash: b4e8f3a2c1d5...
```

### 3. Update Remote Config
- `puzzle_data_url`: `https://your-project.web.app/puzzles-v1.1.0.json`
- `puzzle_data_version`: `b4e8f3a2c1d5...` (the hash)

### 4. Players Get Update
App logs will show:
```
[PuzzleDataManager] Remote puzzle pack v1.1.0: Added 50 challenging expert-level puzzles
[PuzzleDataManager] Puzzles updated to version: b4e8f3a2c1d5...
```

## Migration from Old Format

If you have existing puzzles without metadata, just add it:

**Before:**
```json
{
  "puzzles": [ /* ... */ ]
}
```

**After:**
```json
{
  "version": "1.0.0",
  "createdAt": "2024-12-16T00:00:00Z",
  "description": "Legacy puzzle pack",
  "puzzleCount": 100,
  "rackSizes": [5],
  "puzzles": [ /* ... same puzzles */ ]
}
```

All metadata fields are optional, so the app will still work with old files.

## Validation

The app validates:
- ✅ `puzzles` array exists and has items
- ✅ Each puzzle has `start` and `rack` fields
- ✅ Metadata types are correct (if present)
- ✅ Content hash matches expected (from Remote Config)

If validation fails:
- Remote updates are rejected
- App keeps current version
- Error logged to console

## Best Practices

1. **Always update version** when changing puzzles
2. **Use meaningful descriptions** for what changed
3. **Keep puzzleCount accurate** for validation
4. **Update createdAt** to current timestamp
5. **Test locally** before deploying to Firebase
6. **Keep old versions** in Firebase Storage (e.g., v1.0.0, v1.1.0)
7. **Document changes** in your own changelog

## Debug Panel Display

With metadata, your debug panel shows:
```
Puzzle Data
├─ Pack Version: 1.1.0     ← Semantic version from JSON
├─ Hash: b4e8f3a2...       ← Content hash for validation
├─ Source: remote          ← Where loaded from
├─ Count: 150              ← Number of puzzles
└─ Updated: 10:30:45 AM    ← When loaded/updated
```

This gives you full visibility into what puzzle pack is active!
