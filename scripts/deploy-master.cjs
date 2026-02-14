#!/usr/bin/env node

/**
 * Deploy locales_master.json to _locales files
 *
 * This script reads a browser's locales_master.json and updates all messages.json files
 * in the corresponding _locales directory.
 *
 * Usage:
 *   node scripts/deploy-master.cjs chrome     - Deploy public_chrome/locales_master.json
 *   node scripts/deploy-master.cjs firefox    - Deploy public_firefox/locales_master.json
 *   node scripts/deploy-master.cjs            - Deploy both (default)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// Configuration
const BROWSERS = ['chrome', 'firefox', 'edge'];

// ANSI Colors
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function deployMaster(browser) {
  const publicDir = path.join(ROOT_DIR, `public_${browser}`);
  const masterFile = path.join(publicDir, 'locales_master.json');
  const localesDir = path.join(publicDir, '_locales');

  console.log(`${COLORS.blue}${COLORS.bold}📥 Deploying ${browser.toUpperCase()} locales_master.json${COLORS.reset}\n`);

  // Check if master file exists
  if (!fs.existsSync(masterFile)) {
    console.error(`${COLORS.red}❌ Master file not found: public_${browser}/locales_master.json${COLORS.reset}`);
    console.error(`Run 'node scripts/init-master.cjs ${browser}' first.`);
    return false;
  }

  // Read master file
  const master = JSON.parse(fs.readFileSync(masterFile, 'utf8'));
  console.log(`${COLORS.cyan}📄 Reading public_${browser}/locales_master.json${COLORS.reset}`);
  console.log(`${COLORS.cyan}   Keys: ${Object.keys(master).length}${COLORS.reset}`);

  // Pivot structure: Locale -> Key -> { message: Value }
  const outputStructure = {};

  Object.keys(master).forEach(key => {
    const translations = master[key];
    Object.keys(translations).forEach(locale => {
      if (!outputStructure[locale]) {
        outputStructure[locale] = {};
      }
      outputStructure[locale][key] = {
        message: translations[locale]
      };
    });
  });

  console.log(`${COLORS.cyan}   Locales: ${Object.keys(outputStructure).length}${COLORS.reset}\n`);

  // Ensure _locales directory exists
  if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
    console.log(`   ${COLORS.yellow}⚠️  Created directory: ${localesDir}${COLORS.reset}`);
  }

  console.log(`${COLORS.cyan}📂 Deploying to public_${browser}/_locales${COLORS.reset}`);

  // Write separate files for each locale
  let updated = 0;
  Object.keys(outputStructure).forEach(locale => {
    const localePath = path.join(localesDir, locale);

    // Create locale directory if it doesn't exist
    if (!fs.existsSync(localePath)) {
      fs.mkdirSync(localePath, { recursive: true });
    }

    const filePath = path.join(localePath, 'messages.json');

    // Sort keys alphabetically for consistency
    const sortedContent = {};
    Object.keys(outputStructure[locale]).sort().forEach(key => {
      sortedContent[key] = outputStructure[locale][key];
    });

    fs.writeFileSync(filePath, JSON.stringify(sortedContent, null, 2) + '\n');
    console.log(`   ${COLORS.green}✓${COLORS.reset} ${locale}`);
    updated++;
  });

  console.log(`\n${COLORS.green}${COLORS.bold}✅ Deployment complete!${COLORS.reset}`);
  console.log(`${COLORS.cyan}📊 Files updated: ${updated}${COLORS.reset}\n`);

  return true;
}

// Main execution
const browserArg = process.argv[2];

if (browserArg && !BROWSERS.includes(browserArg)) {
  console.error(`${COLORS.yellow}❌ Invalid browser: ${browserArg}${COLORS.reset}`);
  console.log(`Valid options: ${BROWSERS.join(', ')}, or no argument for all\n`);
  process.exit(1);
}

if (browserArg) {
  // Single browser
  const success = deployMaster(browserArg);
  if (success) {
    console.log(`${COLORS.yellow}💡 Next steps:${COLORS.reset}`);
    console.log(`   1. Build the extension: npm run build:${browserArg}`);
    console.log(`   2. Test in browser to verify translations`);
  }
} else {
  // All browsers
  let successCount = 0;
  BROWSERS.forEach(browser => {
    if (deployMaster(browser)) {
      successCount++;
    }
    console.log(''); // Separator
  });

  if (successCount > 0) {
    console.log(`${COLORS.yellow}💡 Next steps:${COLORS.reset}`);
    console.log(`   1. Build the extension: npm run build:all`);
    console.log(`   2. Test in browsers to verify translations`);
  }
}
