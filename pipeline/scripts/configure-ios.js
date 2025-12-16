#!/usr/bin/env node

/**
 * configure-ios.js
 * Configures iOS project with target-specific settings
 */

const path = require('path');
const fs = require('fs');
const plist = require('plist');

const target = process.argv[2];

if (!target) {
  console.error('Usage: node configure-ios.js <target>');
  process.exit(1);
}

const configPath = path.join(__dirname, '../configs', `${target}.json`);
if (!fs.existsSync(configPath)) {
  console.error(`Config file not found: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const iosAppDir = path.resolve(__dirname, '../../container/ios/App/App');
const infoPlistPath = path.join(iosAppDir, 'Info.plist');
const capacitorConfigPath = path.resolve(__dirname, '../../container/capacitor.config.ts');
const projectPbxprojPath = path.resolve(__dirname, '../../container/ios/App/App.xcodeproj/project.pbxproj');

console.log(`Configuring iOS for target: ${target}`);

try {
  // Update Capacitor config
  if (fs.existsSync(capacitorConfigPath)) {
    let capacitorConfig = fs.readFileSync(capacitorConfigPath, 'utf8');
    capacitorConfig = capacitorConfig.replace(
      /appId:\s*['"][^'"]*['"]/,
      `appId: '${config.bundleId}'`
    );
    capacitorConfig = capacitorConfig.replace(
      /appName:\s*['"][^'"]*['"]/,
      `appName: '${config.appName}'`
    );
    fs.writeFileSync(capacitorConfigPath, capacitorConfig);
    console.log(`✓ Updated capacitor.config.ts`);
  }

  // Update Info.plist if it exists
  if (fs.existsSync(infoPlistPath)) {
    const infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8');
    const infoPlist = plist.parse(infoPlistContent);
    
    // Update bundle identifier
    infoPlist.CFBundleIdentifier = config.bundleId;
    infoPlist.CFBundleName = config.appName;
    infoPlist.CFBundleDisplayName = config.appName;
    
    // Add AdMob App ID (required for SDK initialization)
    // Use test ID if not provided in config
    if (config.enableAds) {
      infoPlist.GADApplicationIdentifier = config.adMobAppId || "ca-app-pub-3940256099942544~1458002511";
      
      // Add ad unit ID if provided
      if (config.adUnitId) {
        infoPlist.GADInterstitialAdUnitID = config.adUnitId;
      }
    }
    
    // Add RevenueCat API key if provided
    if (config.revenueCatApiKey) {
      infoPlist.RevenueCatAPIKey = config.revenueCatApiKey;
    }
    
    // Add Remove Ads product ID if provided
    if (config.removeAdsProductId) {
      infoPlist.RemoveAdsProductID = config.removeAdsProductId;
    }
    
    fs.writeFileSync(infoPlistPath, plist.build(infoPlist));
    console.log(`✓ Updated Info.plist`);
  } else {
    console.log(`⚠ Info.plist not found at ${infoPlistPath}`);
    console.log(`  This is normal if Capacitor hasn't been initialized yet.`);
  }

  // Copy Firebase config if specified
  if (config.firebaseConfig) {
    const firebaseConfigPath = path.resolve(__dirname, '../../', config.firebaseConfig);
    if (fs.existsSync(firebaseConfigPath)) {
      const destPath = path.join(iosAppDir, 'GoogleService-Info.plist');
      fs.copyFileSync(firebaseConfigPath, destPath);
      console.log(`✓ Copied Firebase config`);
    } else {
      console.log(`⚠ Firebase config not found at ${firebaseConfigPath}`);
    }
  }

  // Update Xcode project bundle identifier and increment build number (single source of truth)
  if (fs.existsSync(projectPbxprojPath)) {
    let projectContent = fs.readFileSync(projectPbxprojPath, 'utf8');

    // Replace PRODUCT_BUNDLE_IDENTIFIER in both Debug and Release configurations
    projectContent = projectContent.replace(
      /PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g,
      `PRODUCT_BUNDLE_IDENTIFIER = ${config.bundleId};`
    );

    // Auto-increment build number (CURRENT_PROJECT_VERSION)
    const buildNumberMatch = projectContent.match(/CURRENT_PROJECT_VERSION = (\d+);/);
    if (buildNumberMatch) {
      const currentBuild = parseInt(buildNumberMatch[1], 10);
      const nextBuild = currentBuild + 1;
      projectContent = projectContent.replace(
        /CURRENT_PROJECT_VERSION = \d+;/g,
        `CURRENT_PROJECT_VERSION = ${nextBuild};`
      );
      console.log(`✓ Incremented build number: ${currentBuild} → ${nextBuild}`);
    } else {
      console.log(`⚠ Could not find CURRENT_PROJECT_VERSION in project.pbxproj (no build increment performed)`);
    }

    fs.writeFileSync(projectPbxprojPath, projectContent);
    console.log(`✓ Updated Xcode project bundle identifier`);
  } else {
    console.log(`⚠ Xcode project not found at ${projectPbxprojPath}`);
  }

  console.log(`✓ iOS configuration completed for ${target}`);
} catch (error) {
  console.error(`✗ Failed to configure iOS for ${target}`);
  console.error(error.message);
  process.exit(1);
}
