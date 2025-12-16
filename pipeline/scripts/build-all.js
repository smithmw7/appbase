#!/usr/bin/env node

/**
 * build-all.js
 * Orchestrates full build process for a target:
 * 1. Build content
 * 2. Sync to Capacitor
 * 3. Configure iOS
 */

const { execSync } = require('child_process');
const path = require('path');

const target = process.argv[2];

if (!target) {
  console.error('Usage: node build-all.js <target>');
  console.error('Targets: word-strike');
  process.exit(1);
}

const validTargets = ['word-strike'];
if (!validTargets.includes(target)) {
  console.error(`Invalid target: ${target}`);
  console.error(`Valid targets: ${validTargets.join(', ')}`);
  process.exit(1);
}

console.log(`\n🚀 Building target: ${target}\n`);

const scriptsDir = path.join(__dirname);
const rootDir = path.resolve(__dirname, '../..');

try {
  // Step 0: Sync audio assets
  console.log('🎵 Step 0: Syncing audio assets...');
  execSync(`node "${path.join(scriptsDir, 'sync-audio-assets.js')}"`, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });

  // Step 1: Build content
  console.log('📦 Step 1: Building content...');
  execSync(`node "${path.join(scriptsDir, 'build-content.js')}" ${target}`, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });

  // Step 2: Sync to Capacitor
  console.log('\n🔄 Step 2: Syncing to Capacitor...');
  execSync(`node "${path.join(scriptsDir, 'sync-capacitor.js')}" ${target}`, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });

  // Step 3: Configure iOS
  console.log('\n⚙️  Step 3: Configuring iOS...');
  execSync(`node "${path.join(scriptsDir, 'configure-ios.js')}" ${target}`, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });

  console.log(`\n✅ Build completed successfully for ${target}!`);
  
  // Step 4: Open Xcode
  console.log(`\n🚀 Step 4: Opening Xcode...`);
  try {
    const containerDir = path.resolve(__dirname, '../../container');
    execSync('npx cap open ios', {
      cwd: containerDir,
      stdio: 'inherit',
      shell: true
    });
    console.log(`✓ Xcode opened`);
  } catch (error) {
    console.warn(`⚠️  Failed to open Xcode automatically. You can open it manually with: cd container && npx cap open ios`);
  }
} catch (error) {
  console.error(`\n❌ Build failed for ${target}`);
  process.exit(1);
}
