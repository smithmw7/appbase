#!/bin/bash

# Deploy Puzzle JSON to Firebase Hosting
# Usage: ./scripts/deploy-puzzles.sh <version>
# Example: ./scripts/deploy-puzzles.sh v1

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ Error: Version required"
  echo ""
  echo "Usage: ./scripts/deploy-puzzles.sh <version>"
  echo "Example: ./scripts/deploy-puzzles.sh v1"
  echo ""
  exit 1
fi

echo "🧩 Deploying Puzzle Data"
echo "================================"
echo "Version: $VERSION"
echo ""

# Check if Firebase Hosting is initialized
if ! grep -q "hosting" firebase.json 2>/dev/null; then
    echo "❌ Firebase Hosting not initialized"
    echo ""
    echo "Please run: npx firebase-tools init hosting"
    echo ""
    exit 1
fi

# Get hosting public directory from firebase.json
PUBLIC_DIR=$(grep -A 5 "hosting" firebase.json | grep "public" | cut -d'"' -f4)
if [ -z "$PUBLIC_DIR" ]; then
    PUBLIC_DIR="public"
fi

echo "📁 Public directory: $PUBLIC_DIR"

# Create public directory if it doesn't exist
mkdir -p "$PUBLIC_DIR"

# Check if puzzles.json exists
PUZZLE_SOURCE="content/word-strike/puzzles.json"
if [ ! -f "$PUZZLE_SOURCE" ]; then
    echo "❌ Error: $PUZZLE_SOURCE not found"
    exit 1
fi

# Copy puzzle file with version
PUZZLE_DEST="$PUBLIC_DIR/puzzles-$VERSION.json"
echo "📋 Copying $PUZZLE_SOURCE → $PUZZLE_DEST"
cp "$PUZZLE_SOURCE" "$PUZZLE_DEST"

# Extract version from JSON if available
if command -v jq &> /dev/null; then
    JSON_VERSION=$(jq -r '.version // "N/A"' "$PUZZLE_DEST")
    JSON_DESC=$(jq -r '.description // "N/A"' "$PUZZLE_DEST")
    echo "📦 Pack Version: $JSON_VERSION"
    echo "📝 Description: $JSON_DESC"
else
    echo "ℹ️  Install jq to see JSON metadata: brew install jq"
fi

# Calculate hash (simple approach)
if command -v shasum &> /dev/null; then
    HASH=$(shasum -a 256 "$PUZZLE_DEST" | cut -d' ' -f1)
    echo "🔐 SHA-256 hash: $HASH"
else
    echo "⚠️  Warning: shasum not found, cannot calculate hash"
fi

# Deploy to Firebase Hosting
echo ""
echo "📋 Deploying to Firebase Hosting..."
if npx firebase-tools deploy --only hosting; then
    echo "✅ Hosting deployed successfully"
else
    echo "❌ Failed to deploy hosting"
    exit 1
fi

# Get project ID
PROJECT=$(npx firebase-tools use 2>&1 | grep -v "Active Project" | tr -d ' ')

echo ""
echo "================================"
echo "✅ Puzzle data deployed!"
echo ""
if [ -n "$JSON_VERSION" ] && [ "$JSON_VERSION" != "N/A" ]; then
    echo "📦 Pack Version: $JSON_VERSION"
    echo "📝 Description: $JSON_DESC"
    echo ""
fi
echo "📝 Puzzle URL:"
echo "   https://$PROJECT.web.app/puzzles-$VERSION.json"
echo ""
if [ -n "$HASH" ]; then
    echo "🔐 Content Hash: $HASH"
    echo ""
fi
echo "📋 Next steps:"
echo "1. Go to Firebase Console → Remote Config"
echo "2. Set 'puzzle_data_url' to the URL above"
echo "3. Set 'puzzle_data_version' to the hash above (for validation)"
echo "4. Publish Remote Config changes"
echo ""
echo "💡 The JSON file contains version '$JSON_VERSION' internally"
echo "   The hash ensures content integrity"
echo ""
echo "🔗 Firebase Console: https://console.firebase.google.com/project/$PROJECT/config"
