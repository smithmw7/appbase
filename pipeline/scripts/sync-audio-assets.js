#!/usr/bin/env node

/**
 * sync-audio-assets.js
 * Copies audio assets from resources/ to content/word-strike/public/
 * so they are included in the Vite build output
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../..');
const resourcesDir = path.join(rootDir, 'resources');
const contentDir = path.join(rootDir, 'content/word-strike/public');

console.log('🎵 Syncing audio assets...');
console.log(`From: ${resourcesDir}`);
console.log(`To: ${contentDir}`);

try {
  // Create public directory structure if it doesn't exist
  const musicDir = path.join(contentDir, 'music');
  const sfxDir = path.join(contentDir, 'sfx');
  
  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
  }
  if (!fs.existsSync(sfxDir)) {
    fs.mkdirSync(sfxDir, { recursive: true });
  }

  // Copy music files
  const musicSource = path.join(resourcesDir, 'music');
  if (fs.existsSync(musicSource)) {
    const musicFiles = fs.readdirSync(musicSource);
    for (const file of musicFiles) {
      const srcPath = path.join(musicSource, file);
      const destPath = path.join(musicDir, file);
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ Copied music/${file}`);
      }
    }
  } else {
    console.warn(`  ⚠️  Music source directory not found: ${musicSource}`);
  }

  // Copy SFX files
  const sfxSource = path.join(resourcesDir, 'sfx');
  if (fs.existsSync(sfxSource)) {
    const sfxFiles = fs.readdirSync(sfxSource);
    for (const file of sfxFiles) {
      const srcPath = path.join(sfxSource, file);
      const destPath = path.join(sfxDir, file);
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ Copied sfx/${file}`);
      }
    }
  } else {
    console.warn(`  ⚠️  SFX source directory not found: ${sfxSource}`);
  }

  console.log('✅ Audio assets synced successfully');
} catch (error) {
  console.error('❌ Failed to sync audio assets');
  console.error(error.message);
  process.exit(1);
}
