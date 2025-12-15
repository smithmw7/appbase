#!/usr/bin/env node

/**
 * build-content.js
 * Builds a React content project for a specific target
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const target = process.argv[2];

if (!target) {
  console.error('Usage: node build-content.js <target>');
  process.exit(1);
}

const configPath = path.join(__dirname, '../configs', `${target}.json`);
if (!fs.existsSync(configPath)) {
  console.error(`Config file not found: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const contentDir = path.resolve(__dirname, '../../', config.contentDir);

if (!fs.existsSync(contentDir)) {
  console.error(`Content directory not found: ${contentDir}`);
  process.exit(1);
}

console.log(`Building content for target: ${target}`);
console.log(`Content directory: ${contentDir}`);

try {
  // Change to content directory and build
  process.chdir(contentDir);
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`✓ Content built successfully for ${target}`);
} catch (error) {
  console.error(`✗ Failed to build content for ${target}`);
  process.exit(1);
}
