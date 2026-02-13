# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **production-ready Chrome/Firefox extension boilerplate** built with modern web technologies. It provides a solid foundation for building browser extensions with best practices built-in.

**Tech Stack:**

- **Vue 3** with Composition API
- **TypeScript** with strict type checking
- **Tailwind CSS 4** for styling
- **Shadow DOM** for CSS isolation
- **Lightweight i18n** system (6 languages)
- **Dark mode** with auto-detection
- **Manifest V3** for Chrome & Firefox

**Browser Support:**

- **Chrome**: Chrome 88+ (Manifest V3)
- **Firefox**: Firefox 140+ (Manifest V3)

## Build Commands

**Production builds** (minified, no console logs, creates ZIP for store upload):

```bash
npm run build:chrome       # Chrome → dist-chrome/ + ZIP
npm run build:firefox      # Firefox → dist-firefox/ + ZIP
npm run build:all          # Both browsers with ZIPs
```

**Development builds** (keeps console logs, includes sourcemaps, NO ZIP):

```bash
npm run build:chrome:dev   # Chrome → dist-chrome/ (no ZIP)
npm run build:firefox:dev  # Firefox → dist-firefox/ (no ZIP)
npm run build:all:dev      # Both browsers without ZIPs
```

**Other commands**:

```bash
npm run type-check         # TypeScript type checking (no build)
npm run lint               # Run ESLint with auto-fix
npm run format             # Format code with Prettier
```

## Code Quality Rules

The project includes format and lint scripts:

- `npm run format` - Format code with Prettier
- `npm run lint` - Run ESLint with auto-fix

**Note:** Only run these commands when explicitly requested by the user. Do not run them automatically after code modifications.

## Project Structure

```
src/
├── background.ts              # Service worker
├── content-script.ts          # Content script with Shadow DOM example
├── popup/                     # Extension popup (Vue 3)
│   ├── Popup.vue             # Main popup component
│   ├── popup.html            # HTML entry point
│   ├── popup.ts              # TypeScript entry
│   └── popup.css             # Tailwind CSS
├── core/
│   └── utils/
│       ├── i18n.ts           # Lightweight i18n (6 languages)
│       └── shadowDOM.ts      # Shadow DOM utilities
├── components/
│   └── ReviewPrompt.vue      # Generic review prompt component
├── composables/
│   └── useI18nWrapper.ts     # Vue 3 i18n composable
├── services/
│   └── reviewPromptService.ts # Generic review prompt service
├── utils/
│   ├── browser-polyfill.ts   # Chrome/Firefox API polyfill
│   └── browser-detection.ts  # Browser detection helpers
└── types/
    └── common.ts             # TypeScript types
```

## Key Features

### 1. Shadow DOM Integration

The boilerplate includes Shadow DOM utilities for complete CSS isolation from host pages.

**Usage:**

```typescript
import { createShadowDOM, createMountPoint } from '@/core/utils/shadowDOM'

const { shadowRoot, container } = createShadowDOM('my-extension-root')
const mountPoint = createMountPoint(shadowRoot, 'app')
createApp(App).mount(mountPoint)
```

### 2. Lightweight i18n System

Custom internationalization with 6 languages (en, fr, es, de, zh, ja).

**Usage:**

```typescript
import { useI18nWrapper } from '@/composables/useI18nWrapper'

const { t, locale, setLocale } = useI18nWrapper()
t('appTitle') // Translated string
setLocale('fr') // Change language
```

**Add translations in** `src/core/utils/i18n.ts`

### 3. Dark Mode

Built-in theme system with auto/light/dark modes. Syncs to `chrome.storage`.

**Usage in Popup.vue:**

- Click theme button to cycle through modes
- Persists user preference
- Auto-detects system theme

### 4. Review Prompt Service (Generic)

Ready-to-use review prompt system with configurable triggers.

**Setup:**

```typescript
// 1. Update store URLs in src/services/reviewPromptService.ts:
export function getReviewUrl(): string {
  return isFirefox
    ? 'https://addons.mozilla.org/firefox/addon/YOUR-ADDON-ID/reviews/'
    : 'https://chrome.google.com/webstore/detail/YOUR-EXTENSION-ID/reviews'
}

// 2. Track user actions:
import { trackUserAction } from '@/services/reviewPromptService'
await trackUserAction() // Call on significant user action

// 3. Show prompt (already in Popup.vue):
<ReviewPrompt :minActions="5" />
```

### 5. Cross-Browser Support

Dual manifest system with browser-specific builds.

**Chrome** (`manifests/manifest.chrome.json`):

- Uses `service_worker` for background
- Supports Chrome-specific APIs

**Firefox** (`manifests/manifest.firefox.json`):

- Uses `scripts` for background
- Includes `browser_specific_settings`
- Update `gecko.id` with your Firefox extension ID

## Customization Guide

### 1. Update Extension Metadata

**In `public_chrome/_locales/en/messages.json` and `public_firefox/_locales/en/messages.json`:**

```json
{
  "extensionName": { "message": "Your Extension Name" },
  "extensionDescription": { "message": "Your extension description" },
  "actionTitle": { "message": "Your Extension Name" }
}
```

### 2. Replace Icons

Replace placeholder icons in `public_chrome/icons/` and `public_firefox/icons/`:

- `logo-16.png` (16x16)
- `logo-32.png` (32x32)
- `logo-48.png` (48x48)
- `logo-128.png` (128x128)

### 3. Update i18n Translations

Edit `src/core/utils/i18n.ts` to customize strings for 6 languages.

### 4. Customize Popup

Edit `src/popup/Popup.vue`:

- Replace welcome message with your UI
- Keep header (title + language selector + theme toggle)
- Keep footer for attribution

### 5. Add Content Script Logic

Edit `src/content-script.ts` to add your extension logic. Shadow DOM example is included.

### 6. Update Firefox Extension ID

In `manifests/manifest.firefox.json`, change:

```json
"gecko": {
  "id": "your-unique-extension-id@example.com"
}
```

## Production Checklist

Before publishing:

1. ✅ Update extension name/description in `_locales/en/messages.json`
2. ✅ Replace all placeholder icons (16/32/48/128px)
3. ✅ Update `getReviewUrl()` in `reviewPromptService.ts`
4. ✅ Update Firefox extension ID in `manifest.firefox.json`
5. ✅ Customize popup UI in `Popup.vue`
6. ✅ Run `npm run build:chrome` and `npm run build:firefox`
7. ✅ Test in both browsers with `dist-chrome/` and `dist-firefox/`
8. ✅ Upload ZIPs to Chrome Web Store and Firefox Add-ons

## ⚠️ CRITICAL RULES FOR CLAUDE

### Translation Management

**NEVER translate into multiple languages yourself.** Only work with English translations in `en.json` files.

- ✅ **DO:** Modify or add keys in `src/core/utils/i18n.ts` for **English only** (`en` locale)
- ❌ **DON'T:** Add or modify translations in other languages (fr, es, de, zh, ja, etc.)
- ❌ **DON'T:** Copy the English value into other language keys as a placeholder — leave other languages completely untouched
- ❌ **DON'T:** Add a key to other language objects even if TypeScript type-checking complains about missing keys — ignore those type errors, they are expected and will be resolved by the automated translation scripts

**Reason:** The project owner has automated scripts to handle translations across all languages. Adding English text to non-English keys creates noise and makes it impossible to know which keys still need to be translated.

**Exception:** Only translate if explicitly requested by the user with clear instructions.

### Build Management

**NEVER build the extension yourself.**

- ❌ **DON'T:** Run `npm run build:chrome`, `npm run build:firefox`, or `npm run build:all`
- ❌ **DON'T:** Generate ZIP files for distribution
- ❌ **DON'T:** Modify `dist-chrome/` or `dist-firefox/` directories

**Reason:** The project owner controls the build process and versioning. Let them handle production builds.

**Exception:** Only build if explicitly requested by the user for testing purposes.

## License

MIT
