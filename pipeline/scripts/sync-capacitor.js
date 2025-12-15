#!/usr/bin/env node

/**
 * sync-capacitor.js
 * Syncs built web assets to Capacitor public directory
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const target = process.argv[2];

if (!target) {
  console.error('Usage: node sync-capacitor.js <target>');
  process.exit(1);
}

const configPath = path.join(__dirname, '../configs', `${target}.json`);
if (!fs.existsSync(configPath)) {
  console.error(`Config file not found: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const contentDir = path.resolve(__dirname, '../../', config.contentDir);
const distDir = path.join(contentDir, 'dist');
const publicDir = path.resolve(__dirname, '../../container/public');

if (!fs.existsSync(distDir)) {
  console.error(`Dist directory not found: ${distDir}`);
  console.error('Please build the content first with: node build-content.js <target>');
  process.exit(1);
}

console.log(`Syncing content for target: ${target}`);
console.log(`From: ${distDir}`);
console.log(`To: ${publicDir}`);

try {
  // Create public directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Clear existing public directory
  const files = fs.readdirSync(publicDir);
  for (const file of files) {
    const filePath = path.join(publicDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  }

  // Copy dist contents to public
  const distFiles = fs.readdirSync(distDir);
  for (const file of distFiles) {
    const srcPath = path.join(distDir, file);
    const destPath = path.join(publicDir, file);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  console.log(`✓ Content synced successfully for ${target}`);

  // Run Capacitor sync
  const containerDir = path.resolve(__dirname, '../../container');
  process.chdir(containerDir);
  execSync('npx cap sync ios', { stdio: 'inherit' });
  console.log(`✓ Capacitor sync completed`);
} catch (error) {
  console.error(`✗ Failed to sync content for ${target}`);
  console.error(error.message);
  process.exit(1);
}
