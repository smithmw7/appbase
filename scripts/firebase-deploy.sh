#!/bin/bash

# Firebase Deployment Script
# Deploys Firestore rules, Remote Config, and optionally Hosting

set -e

echo "🔥 Firebase Deployment Script"
echo "================================"
echo ""

# Check if Firebase CLI is authenticated
echo "📋 Step 1: Checking Firebase authentication..."
if ! npx firebase-tools projects:list &>/dev/null; then
    echo "❌ Firebase authentication expired"
    echo ""
    echo "Please run:"
    echo "  npx firebase-tools login --reauth"
    echo ""
    exit 1
fi

echo "✅ Firebase authenticated"
echo ""

# Get current project
PROJECT=$(npx firebase-tools use 2>&1 | grep -v "Active Project")
echo "📦 Current project: $PROJECT"
echo ""

# Deploy Firestore rules
echo "📋 Step 2: Deploying Firestore rules..."
if npx firebase-tools deploy --only firestore:rules; then
    echo "✅ Firestore rules deployed"
else
    echo "❌ Failed to deploy Firestore rules"
    exit 1
fi
echo ""

# Deploy Remote Config
echo "📋 Step 3: Deploying Remote Config..."
if npx firebase-tools deploy --only remoteconfig; then
    echo "✅ Remote Config deployed"
else
    echo "❌ Failed to deploy Remote Config"
    exit 1
fi
echo ""

# Check if hosting is initialized
if grep -q "hosting" firebase.json 2>/dev/null; then
    echo "📋 Step 4: Firebase Hosting detected"
    read -p "Deploy Hosting? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if npx firebase-tools deploy --only hosting; then
            echo "✅ Hosting deployed"
        else
            echo "❌ Failed to deploy Hosting"
        fi
    else
        echo "⏭️  Skipping Hosting deployment"
    fi
else
    echo "ℹ️  Firebase Hosting not configured (optional)"
fi

echo ""
echo "================================"
echo "✅ Firebase deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to Firebase Console → Remote Config"
echo "2. Set 'puzzle_data_url' to your puzzle JSON URL"
echo "3. Publish Remote Config changes"
echo ""
echo "🔗 Firebase Console: https://console.firebase.google.com/project/$PROJECT"
