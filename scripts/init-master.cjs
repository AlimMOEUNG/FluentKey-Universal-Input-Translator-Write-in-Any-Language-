#!/usr/bin/env node

/**
 * Initialize locales_master.json from existing _locales files
 *
 * This script reads all messages.json files from a browser's _locales directory
 * and creates a locales_master.json file in the corresponding public_* directory.
 *
 * Usage:
 *   node scripts/init-master.cjs chrome       - Init public_chrome/locales_master.json
 *   node scripts/init-master.cjs firefox      - Init public_firefox/locales_master.json
 *   node scripts/init-master.cjs              - Init both (default)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// Configuration
const BROWSERS = ['chrome', 'firefox', 'edge'];

// ANSI Colors
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function initMaster(browser) {
  const publicDir = path.join(ROOT_DIR, `public_${browser}`);
  const localesDir = path.join(publicDir, '_locales');
  const masterFile = path.join(publicDir, 'locales_master.json');

  console.log(`${COLORS.blue}${COLORS.bold}📦 Initializing ${browser.toUpperCase()} locales_master.json${COLORS.reset}\n`);

  if (!fs.existsSync(localesDir)) {
    console.error(`${COLORS.yellow}⚠️  Directory not found: ${localesDir}${COLORS.reset}`);
    return false;
  }

  const master = {};
  const locales = fs.readdirSync(localesDir);

  console.log(`${COLORS.cyan}📂 Reading from public_${browser}/_locales${COLORS.reset}`);
  console.log(`${COLORS.cyan}   Found ${locales.length} locales${COLORS.reset}\n`);

  locales.forEach(locale => {
    const msgPath = path.join(localesDir, locale, 'messages.json');
    if (fs.existsSync(msgPath)) {
      try {
        const content = JSON.parse(fs.readFileSync(msgPath, 'utf8'));

        // Extract keys and pivot structure: Key -> Locale -> Value
        Object.keys(content).forEach(key => {
          if (!master[key]) {
            master[key] = {};
          }
          master[key][locale] = content[key].message;
        });

        console.log(`   ${COLORS.green}✓${COLORS.reset} ${locale}`);
      } catch (e) {
        console.error(`   ${COLORS.yellow}✗ ${locale}: ${e.message}${COLORS.reset}`);
      }
    }
  });

  // Sort keys alphabetically for consistency
  const sortedMaster = {};
  Object.keys(master).sort().forEach(key => {
    // Sort locales inside each key alphabetically
    const sortedLocales = {};
    Object.keys(master[key]).sort().forEach(locale => {
      sortedLocales[locale] = master[key][locale];
    });
    sortedMaster[key] = sortedLocales;
  });

  // Write to file
  fs.writeFileSync(masterFile, JSON.stringify(sortedMaster, null, 2) + '\n');

  console.log(`\n${COLORS.green}${COLORS.bold}✅ Master file created!${COLORS.reset}`);
  console.log(`${COLORS.cyan}📄 File: public_${browser}/locales_master.json${COLORS.reset}`);
  console.log(`${COLORS.cyan}📊 Keys: ${Object.keys(sortedMaster).length}${COLORS.reset}`);
  console.log(`${COLORS.cyan}🌍 Locales: ${Object.keys(sortedMaster[Object.keys(sortedMaster)[0]] || {}).length}${COLORS.reset}\n`);

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
  const success = initMaster(browserArg);
  if (success) {
    console.log(`${COLORS.yellow}💡 Next steps:${COLORS.reset}`);
    console.log(`   1. Edit public_${browserArg}/locales_master.json to update translations`);
    console.log(`   2. Run: node scripts/deploy-master.cjs ${browserArg}`);
  }
} else {
  // All browsers
  let successCount = 0;
  BROWSERS.forEach(browser => {
    if (initMaster(browser)) {
      successCount++;
    }
    console.log(''); // Separator
  });

  if (successCount > 0) {
    console.log(`${COLORS.yellow}💡 Next steps:${COLORS.reset}`);
    console.log(`   1. Edit public_chrome/locales_master.json and public_firefox/locales_master.json`);
    console.log(`   2. Run: node scripts/deploy-master.cjs`);
  }
}
