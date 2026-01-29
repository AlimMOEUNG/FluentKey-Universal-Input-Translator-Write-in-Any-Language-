#!/usr/bin/env node

/**
 * Apply Translations Script
 *
 * This script reads a JSON file containing translations and applies them to src/core/utils/i18n.ts
 * replacing the [MISSING] placeholders.
 *
 * Usage: node scripts/apply-translations.js translations.json
 */

import fs from 'fs';
import path from 'path';

const I18N_FILE = path.join(process.cwd(), 'src/core/utils/i18n.ts');

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.log('Usage: node scripts/apply-translations.js <translations.json>');
  process.exit(1);
}

const translationsFile = path.resolve(process.cwd(), args[0]);

if (!fs.existsSync(translationsFile)) {
  console.error(`❌ File not found: ${translationsFile}`);
  process.exit(1);
}

try {
  const translations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));
  let content = fs.readFileSync(I18N_FILE, 'utf8');
  let totalApplied = 0;

  console.log('Applying translations...');

  for (const [locale, keys] of Object.entries(translations)) {
    // Find the const declaration for this locale
    const constRegex = new RegExp(`(const ${locale}Translations: TranslationMap = \\{)([\\s\\S]*?)(\\n\\})`, 'g');
    const match = constRegex.exec(content);

    if (!match) {
      console.warn(`⚠️  Locale block not found: ${locale}`);
      continue;
    }

    let block = match[0];
    let blockModified = false;

    for (const [key, value] of Object.entries(keys)) {
      // Intelligent quoting based on content
      let quoteWrapper = "'";
      let processedValue = value.split("\n").join("\\n");

      if (value.includes("'") && !value.includes('"')) {
        quoteWrapper = '"';
      } else if (value.includes("'")) {
        // Has single quotes (and maybe double quotes too), so escape single quotes
        processedValue = processedValue.split("'").join("\\'");
      }

      const safeKey = key.replace(/[.*+?^${}()|[\\]/g, '\\$&');

      // Match indentation, key, then any quote (or none), then [MISSING], then anything until newline
      const keyRegex = new RegExp(`([ \t]*['"]?${safeKey}['"]?[ \t]*:[ \t]*)['"]?\\[MISSING\\].*?(,?)(\n|$)`, 'm');

      if (keyRegex.test(block)) {
        // Use function for replacement to avoid $ and \ interpretation issues
        block = block.replace(keyRegex, (match, p1, p2, p3) => {
            return `${p1}${quoteWrapper}${processedValue}${quoteWrapper}${p2}${p3}`;
        });
        blockModified = true;
        totalApplied++;
      }
    }

    if (blockModified) {
      // Replace the entire block in the content
      content = content.replace(match[0], block);
    }
  }

  fs.writeFileSync(I18N_FILE, content, 'utf8');
  console.log(`✅ Success! Applied ${totalApplied} translations to ${I18N_FILE}`);

} catch (error) {
  console.error('❌ Error processing translations:', error);
  process.exit(1);
}
