#!/usr/bin/env node

/**
 * Translation Analysis Script for Simple Input Translator
 *
 * This script analyzes src/core/utils/i18n.ts to find missing translations.
 * It compares the keys in 'enTranslations' with every other locale block.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const I18N_FILE = path.join(process.cwd(), 'src/core/utils/i18n.ts');

// ANSI Colors
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Supported Locales (excluding en)
const LOCALES = ['fr', 'es', 'de', 'zh', 'ja'];

// Check if --fix flag is present
const FIX_MODE = process.argv.includes('--fix') || process.argv.includes('--sync');
const BACKUP_DIR = path.join(process.cwd(), '.backup-translations');

function main() {
  const modeText = FIX_MODE ? 'Translation Synchronizer' : 'Translation Analyzer';
  console.log(`${COLORS.blue}${COLORS.bold}🌍 Simple Input Translator ${modeText}${COLORS.reset}\n`);

  if (FIX_MODE) {
    console.log(`${COLORS.yellow}⚙️  Fix mode enabled: Missing keys will be added with [MISSING] marker${COLORS.reset}\n`);
  }

  if (!fs.existsSync(I18N_FILE)) {
    console.error(`${COLORS.red}❌ Error: File not found at ${I18N_FILE}${COLORS.reset}`);
    process.exit(1);
  }

  let content = fs.readFileSync(I18N_FILE, 'utf8');

  // 1. Extract English Keys (Source of Truth)
  // Regex looks for "const enTranslations = { ... } as const"
  const enBlockMatch = content.match(/const enTranslations = \{([\s\S]*?)\n\} as const/);

  if (!enBlockMatch) {
    console.error(`${COLORS.red}❌ Error: Could not parse 'enTranslations' object.${COLORS.reset}`);
    process.exit(1);
  }

  const enKeys = extractKeysFromBlock(enBlockMatch[1]);
  const enKeysWithValues = FIX_MODE ? extractKeysWithValues(enBlockMatch[1]) : {};
  console.log(`${COLORS.cyan}ℹ️  Reference (EN): ${enKeys.length} keys found.${COLORS.reset}\n`);

  // Create backup if in fix mode
  if (FIX_MODE) {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(BACKUP_DIR, `i18n-${timestamp}.ts`);
    fs.copyFileSync(I18N_FILE, backupFile);
    console.log(`${COLORS.cyan}💾 Backup created: ${backupFile}${COLORS.reset}\n`);
  }

  // 2. Extract locale translations from individual const declarations
  let totalMissing = 0;
  let totalAdded = 0;
  let totalRemoved = 0;
  let modifiedContent = content;
  const allMissingKeys = {}; // Store missing keys for AI Prompt

  // 3. Analyze each locale
  LOCALES.forEach(locale => {
    const localeKeys = extractLocaleKeysFromConst(content, locale);

    if (localeKeys === null) {
      console.log(`${COLORS.red}❌ ${locale.toUpperCase()}: Block not found.${COLORS.reset}`);
      return;
    }

    // Calculate missing keys (in EN but not in locale)
    const missingKeys = enKeys.filter(key => !localeKeys.includes(key));

    // Calculate obsolete keys (in locale but not in EN)
    const obsoleteKeys = localeKeys.filter(key => !enKeys.includes(key));

    const completionRate = Math.round(((enKeys.length - missingKeys.length) / enKeys.length) * 100);

    // Output Report
    if (missingKeys.length === 0 && obsoleteKeys.length === 0) {
      console.log(`${COLORS.green}✅ ${locale.toUpperCase().padEnd(3)}: 100% complete (${localeKeys.length}/${enKeys.length})${COLORS.reset}`);
    } else {
      // Show status line
      const statusParts = [];
      if (missingKeys.length > 0) statusParts.push(`${missingKeys.length} missing`);
      if (obsoleteKeys.length > 0) statusParts.push(`${obsoleteKeys.length} obsolete`);
      console.log(`${COLORS.yellow}⚠️  ${locale.toUpperCase().padEnd(3)}: ${completionRate}% complete - ${statusParts.join(', ')}${COLORS.reset}`);

      // Handle missing keys
      if (missingKeys.length > 0) {
        if (FIX_MODE) {
          // Add missing keys to the locale block
          modifiedContent = addMissingKeysToLocale(modifiedContent, locale, missingKeys, enKeysWithValues);
          totalAdded += missingKeys.length;

          // Store for Prompt
          allMissingKeys[locale] = {};
          missingKeys.forEach(k => {
             allMissingKeys[locale][k] = getEnglishValue(enKeysWithValues[k]);
          });

          console.log(`${COLORS.green}   ✅ Added ${missingKeys.length} missing keys with [MISSING] marker${COLORS.reset}`);

          // Print first 3 added keys as sample
          missingKeys.slice(0, 3).forEach(k => {
            const enValue = getEnglishValue(enKeysWithValues[k]);
            console.log(`${COLORS.cyan}      + ${k}: "[MISSING] ${enValue}"${COLORS.reset}`);
          });
          if (missingKeys.length > 3) {
            console.log(`${COLORS.cyan}      ... and ${missingKeys.length - 3} more${COLORS.reset}`);
          }
        } else {
          // Print first 5 missing keys as sample
          missingKeys.slice(0, 5).forEach(k => {
            console.log(`    ${COLORS.red}- Missing: ${k}${COLORS.reset}`);
          });
          if (missingKeys.length > 5) {
            console.log(`    ${COLORS.red}... and ${missingKeys.length - 5} more${COLORS.reset}`);
          }
        }
        totalMissing += missingKeys.length;
      }

      // Handle obsolete keys
      if (obsoleteKeys.length > 0) {
        if (FIX_MODE) {
          // Remove obsolete keys from the locale block
          modifiedContent = removeObsoleteKeysFromLocale(modifiedContent, locale, obsoleteKeys);
          totalRemoved += obsoleteKeys.length;
          console.log(`${COLORS.purple}   🗑️  Removed ${obsoleteKeys.length} obsolete keys${COLORS.reset}`);

          // Print first 3 removed keys as sample
          obsoleteKeys.slice(0, 3).forEach(k => {
            console.log(`${COLORS.purple}      - ${k}${COLORS.reset}`);
          });
          if (obsoleteKeys.length > 3) {
            console.log(`${COLORS.purple}      ... and ${obsoleteKeys.length - 3} more${COLORS.reset}`);
          }
        } else {
          // Print first 5 obsolete keys as sample
          obsoleteKeys.slice(0, 5).forEach(k => {
            console.log(`    ${COLORS.purple}! Obsolete: ${k}${COLORS.reset}`);
          });
          if (obsoleteKeys.length > 5) {
            console.log(`    ${COLORS.purple}... and ${obsoleteKeys.length - 5} more${COLORS.reset}`);
          }
        }
      }
    }
  });

  console.log(`\n${COLORS.blue}────────────────────────────────────────${COLORS.reset}`);

  if (FIX_MODE && (totalAdded > 0 || totalRemoved > 0)) {
    // Write the modified content back to the file
    fs.writeFileSync(I18N_FILE, modifiedContent, 'utf8');
    console.log(`${COLORS.green}${COLORS.bold}✅ Synchronization completed!${COLORS.reset}`);
    if (totalAdded > 0) {
      console.log(`${COLORS.yellow}📝 Total keys added: ${totalAdded}${COLORS.reset}`);
    }
    if (totalRemoved > 0) {
      console.log(`${COLORS.purple}🗑️  Total keys removed: ${totalRemoved}${COLORS.reset}`);
    }
    console.log(`${COLORS.cyan}💾 File updated: ${I18N_FILE}${COLORS.reset}\n`);

    if (totalAdded > 0) {
      console.log(`${COLORS.yellow}💡 Next steps:${COLORS.reset}`);
      console.log(`${COLORS.yellow}   1. Copy the PROMPT below to an AI assistant.${COLORS.reset}`);
      console.log(`${COLORS.yellow}   2. Save the AI's response as 'translations.json'.${COLORS.reset}`);
      console.log(`${COLORS.yellow}   3. Run 'node scripts/apply-translations.js translations.json'${COLORS.reset}`);
      console.log(`${COLORS.yellow}   4. Run 'node scripts/check-translations.js' to verify${COLORS.reset}`);

      console.log(`\n${COLORS.cyan}🤖 AI PROMPT:${COLORS.reset}`);
      console.log(`----------------------------------------------------------------`);
      console.log(`I have a list of missing translation keys for a project.
Please translate them and generate a JSON file.

INSTRUCTIONS:
1. Translate the English values below into the target languages (fr, es, etc.).
2. Output a SINGLE JSON object.
3. The JSON structure MUST be:
{
  "locale_code": {
    "key_name": "translated_value"
  }
}
4. Ensure valid JSON format (escape quotes if needed).

KEYS TO TRANSLATE:
${JSON.stringify(allMissingKeys, null, 2)}`);
      console.log(`----------------------------------------------------------------`);
    }
  } else if (totalMissing === 0) {
    console.log(`${COLORS.green}${COLORS.bold}🎉 All translations are synchronized!${COLORS.reset}`);
  } else {
    const issues = [];
    if (totalMissing > 0) issues.push(`${totalMissing} missing`);

    // Count obsolete keys from modified content (in report mode, we don't track totalRemoved)
    let totalObsolete = 0;
    if (!FIX_MODE) {
      LOCALES.forEach(locale => {
        const localeKeys = extractLocaleKeysFromConst(content, locale);
        if (localeKeys) {
          const obsoleteKeys = localeKeys.filter(key => !enKeys.includes(key));
          totalObsolete += obsoleteKeys.length;
        }
      });
    }

    if (totalObsolete > 0) issues.push(`${totalObsolete} obsolete`);

    console.log(`${COLORS.yellow}${COLORS.bold}📋 Issues found: ${issues.join(', ')} keys across all languages${COLORS.reset}`);
    console.log(`${COLORS.cyan}\n💡 Tip: Run with --fix flag to automatically fix issues:${COLORS.reset}`);
    console.log(`${COLORS.cyan}   node scripts/check-translations.js --fix${COLORS.reset}`);
  }
}

/**
 * Extracts keys from a const declaration like "const frTranslations: TranslationMap = {"
 */
function extractLocaleKeysFromConst(content, locale) {
  const constRegex = new RegExp(`const ${locale}Translations: TranslationMap = \\{([\\s\\S]*?)\\n\\}`);
  const match = content.match(constRegex);

  if (!match) return null;

  return extractKeysFromBlock(match[1]);
}

/**
 * Extracts object keys from a raw text block of JS/TS object properties
 * e.g. "  key: 'value'," -> "key"
 */
function extractKeysFromBlock(textBlock) {
  const keys = [];
  const lines = textBlock.split('\n');

  // Regex to match "  key: ..." or "  'key': ..."
  // Ignores comments and spreads (...enTranslations)
  // Matches start of line (ignoring whitespace), then either 'word' or "word" or plain word, followed by :
  const keyRegex = /^\s*(?:['"]([a-zA-Z0-9_.]+)['"]|([a-zA-Z0-9_.]+))\s*:/;

  lines.forEach(line => {
    // Skip commented lines
    if (line.trim().startsWith('//')) return;

    const match = line.match(keyRegex);
    if (match) {
      // match[1] is quoted key, match[2] is unquoted key
      keys.push(match[1] || match[2]);
    }
  });

  return keys;
}

/**
 * Extracts object keys with their values from a raw text block
 * Handles both single-line and multi-line values
 */
function extractKeysWithValues(textBlock) {
  const keys = {};
  const lines = textBlock.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip commented lines
    if (line.trim().startsWith('//')) {
      i++;
      continue;
    }

    // Check if this line starts a key
    const keyMatch = line.match(/^\s*(?:['"]([a-zA-Z0-9_.]+)['"]|([a-zA-Z0-9_.]+))\s*:\s*(.*)$/);

    if (keyMatch) {
      const key = keyMatch[1] || keyMatch[2];
      let value = keyMatch[3].trim();

      // Check if value is complete (ends with comma or is multiline)
      // If value is empty, it means it starts on next line, or if it doesn't end with comma it's multiline
      if (!value || !value.endsWith(',')) {
        // Multi-line value - collect until we find the comma
        let fullValue = value ? [value] : [];

        // Continue to next lines
        while (i + 1 < lines.length) {
          i++; // Advance to next line
          const nextLine = lines[i];
          fullValue.push(nextLine);

          // Check if this line ends the value (contains comma outside quotes)
          if (nextLine.trim().endsWith(',') || nextLine.trim().match(/^['"][^'"]*['"],?\s*$/)) {
            break;
          }
        }

        // Join with newline to preserve format
        value = fullValue.join('\n');
      }

      keys[key] = value;
    }

    i++;
  }

  return keys;
}

/**
 * Extract English value, handling both simple strings, objects, and multi-line values
 */
function getEnglishValue(value) {
  if (!value) return '';

  // If it's a plural object like { one: '...', other: '...' }
  if (value.trim().startsWith('{')) {
    const oneMatch = value.match(/one:\s*['"]([^'"]+)['"]/);
    return oneMatch ? oneMatch[1] : value;
  }

  // Handle multi-line values (value starts on next line)
  // Example: key:\n    'value',
  const lines = value.split('\n');
  if (lines.length > 1) {
    // Multi-line: extract from the second line which contains the actual value
    for (const line of lines) {
      const stringMatch = line.match(/['"]([^'"]+)['"]/);
      if (stringMatch) {
        return stringMatch[1];
      }
    }
  }

  // Simple single-line string value
  const stringMatch = value.match(/['"]([^'"]+)['"]/);
  return stringMatch ? stringMatch[1] : value;
}

/**
 * Add missing keys to a locale block in the content
 */
function addMissingKeysToLocale(content, locale, missingKeys, enKeys) {
  // Find the const declaration
  const constRegex = new RegExp(`(const ${locale}Translations: TranslationMap = \\{[\\s\\S]*?)(\\n\\})`);
  const match = content.match(constRegex);

  if (!match) return content;

  // Build the missing keys text (use 2 spaces indentation to match file style)
  let missingKeysText = '';
  missingKeys.forEach(key => {
    const enValue = enKeys[key];
    const englishText = getEnglishValue(enValue);

    // Keys with dots MUST be quoted in JavaScript/TypeScript
    const needsQuotes = key.includes('.');
    const formattedKey = needsQuotes ? `'${key}'` : key;

    // Check if it's a plural value
    if (enValue && enValue.trim().startsWith('{')) {
      // Keep the plural structure but mark it as missing
      missingKeysText += `  ${formattedKey}: ${enValue}, // [MISSING]\n`;
    } else if (enValue && enValue.includes('\n')) {
      // Multi-line value - preserve the format with [MISSING] prefix
      // Replace the original value with [MISSING] + original text
      const lines = enValue.split('\n');
      missingKeysText += `  ${formattedKey}:\n`;
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed) {
          // Extract the quoted text and add [MISSING] prefix
          const quoteMatch = trimmed.match(/^(['"])(.*)(['"],?)$/);
          if (quoteMatch && idx === lines.findIndex(l => l.trim().match(/^['"]/))) {
            // First line with actual text
            const quote = quoteMatch[1];
            const text = quoteMatch[2];
            const ending = quoteMatch[3];
            missingKeysText += `    ${quote}[MISSING] ${text}${ending}\n`;
          } else {
            missingKeysText += `    ${trimmed}\n`;
          }
        }
      });
    } else {
      // Simple single-line value
      missingKeysText += `  ${formattedKey}: '[MISSING] ${englishText}',\n`;
    }
  });

  // Insert before the closing brace
  return content.replace(constRegex, `$1\n${missingKeysText}$2`);
}

/**
 * Remove obsolete keys from a locale block in the content
 * Handles both single-line and multi-line values
 */
function removeObsoleteKeysFromLocale(content, locale, obsoleteKeys) {
  // Find the const declaration
  const constRegex = new RegExp(`(const ${locale}Translations: TranslationMap = \\{)([\\s\\S]*?)(\\n\\})`);
  const match = content.match(constRegex);

  if (!match) return content;

  let blockContent = match[2];

  // Split into lines and filter out obsolete keys (including multi-line values)
  const lines = blockContent.split('\n');
  const filteredLines = [];
  let skipUntilComma = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // If we're in a multi-line value that needs to be skipped
    if (skipUntilComma) {
      // Check if this line ends the value (contains comma)
      if (line.trim().endsWith(',')) {
        skipUntilComma = false; // Found the end, stop skipping
      }
      continue; // Skip this line
    }

    // Check if this line starts an obsolete key
    let isObsolete = false;
    for (const key of obsoleteKeys) {
      // Match both quoted and unquoted keys at the start of the property
      const keyPattern = new RegExp(`^\\s*(?:['"]${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]|${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*:`);
      if (keyPattern.test(line)) {
        isObsolete = true;

        // Check if this is a multi-line value (line doesn't end with comma)
        if (!line.trim().endsWith(',')) {
          // Multi-line value: skip this line and all following lines until we find the comma
          skipUntilComma = true;
        }
        break;
      }
    }

    // Keep the line if it's not obsolete
    if (!isObsolete) {
      filteredLines.push(line);
    }
  }

  // Rejoin with newlines
  const cleanedContent = filteredLines.join('\n');

  // Reconstruct the content
  return content.replace(constRegex, `$1${cleanedContent}$3`);
}

main();
