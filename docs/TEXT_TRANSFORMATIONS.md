# Text Transformations Feature

## Overview

The text transformations feature extends the preset system to support "fun" Unicode text effects alongside translation presets. Instead of translating text via an API, transformation presets apply local Unicode character mappings synchronously — no network calls, no provider configuration.

Users create transformation presets the same way they create translation presets: via the popup UI, with a keyboard shortcut, saved to the same storage. The only difference is a checkbox toggle in the preset editor that switches between translation and transformation mode.

**Supported transformations:**

| Style | Example |
|---|---|
| Strikethrough | s̶t̶r̶i̶k̶e̶t̶h̶r̶o̶u̶g̶h̶ |
| Upside Down | ʇxǝʇ pǝddᴉlɟ |
| Mirror | txet |
| Bold | 𝗯𝗼𝗹𝗱 |
| Italic | 𝘪𝘵𝘢𝘭𝘪𝘤 |
| Bold Italic | 𝙗𝙤𝙡𝙙-𝙞𝙩𝙖𝙡𝙞𝙘 |
| Script | 𝓼𝓬𝓻𝓲𝓹𝓽 |
| Circled | ⓒⓘⓡⓒⓛⓔⓓ |
| Squared | 🅂🅀🅄🅰🅁🅴🅳 |
| Monospace | 𝚖𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎 |
| Double-Struck | 𝕕𝕠𝕦𝕓𝕝𝕖 |
| Fullwidth | ｆｕｌｌｗｉｄｔｈ |
| Small Caps | sᴍᴀʟʟᴄᴀᴘs |

---

## Data Structure

### Preset Union Type

The preset system uses a discriminated union. The `type` field acts as the discriminator:

```typescript
type Preset = TranslationPreset | TransformationPreset
```

### TranslationPreset

```typescript
interface TranslationPreset extends BasePreset {
  type: 'translation'       // Discriminator
  sourceLang: string        // Source language code or 'auto'
  targetLang: string        // Target language code
}
```

### TransformationPreset

```typescript
interface TransformationPreset extends BasePreset {
  type: 'transformation'           // Discriminator
  transformationStyle: TransformationStyle  // Which effect to apply
  exampleText?: string             // User's custom preview text (optional)
}
```

### BasePreset

Shared fields between both preset types:

```typescript
interface BasePreset {
  id: string               // Unique UUID identifier
  name: string             // User-defined name
  keyboardShortcut: string // Keyboard shortcut (e.g., "Alt+S")
  createdAt: number        // Timestamp of creation
}
```

### TransformationStyle

```typescript
type TransformationStyle =
  | 'strikethrough'
  | 'upside-down'
  | 'mirror'
  | 'bold'
  | 'italic'
  | 'bold-italic'
  | 'script'
  | 'circled'
  | 'squared'
  | 'monospace'
  | 'double-struck'
  | 'fullwidth'
  | 'smallcaps'
```

### PresetsSettings (updated)

```typescript
interface PresetsSettings {
  presets: Preset[]                // Mix of translation + transformation presets
  activePresetId: string | null    // ID of currently active preset
  provider: TranslationProvider    // Global provider (used only by translation presets)
}
```

---

## Storage

Both preset types coexist in the same `presetsSettings` key in `chrome.storage.sync`:

```javascript
chrome.storage.sync.get(['presetsSettings'], (result) => {
  console.log(result.presetsSettings)
  // {
  //   presets: [
  //     {
  //       id: "uuid-1",
  //       name: "EN to FR",
  //       type: "translation",
  //       sourceLang: "en",
  //       targetLang: "fr",
  //       keyboardShortcut: "Alt+T",
  //       createdAt: 1234567890
  //     },
  //     {
  //       id: "uuid-2",
  //       name: "Strikethrough",
  //       type: "transformation",
  //       transformationStyle: "strikethrough",
  //       exampleText: "Type to preview...",
  //       keyboardShortcut: "Alt+S",
  //       createdAt: 1234567891
  //     }
  //   ],
  //   activePresetId: "uuid-1",
  //   provider: "google"
  // }
})
```

### Migration

Existing presets without a `type` field are automatically migrated on load. The migration adds `type: 'translation'` to any preset missing it:

```typescript
function migratePresetToTyped(preset: any): Preset {
  if ('type' in preset) return preset       // Already migrated
  return { ...preset, type: 'translation' } // Legacy → translation
}
```

Migration is triggered in `usePresetsSettings.loadFromStorage()` and saved back to storage automatically. No user action required.

---

## Architecture

### Core Components

```
src/
├── core/
│   ├── transformation/
│   │   ├── TransformationEngine.ts     ← Main engine (orchestrator)
│   │   └── transformationMaps.ts       ← Unicode character mappings + apply functions
│   ├── handlers/
│   │   └── KeyboardShortcutHandler.ts  ← Routes to TransformationEngine or TranslationEngine
│   └── storage/
│       └── SettingsManager.ts          ← Updated type annotations
├── composables/
│   └── usePresetsSettings.ts           ← Migration + validation for both types
├── components/
│   └── PresetEditor.vue                ← Checkbox toggle + style selector + live preview
└── types/
    └── common.ts                       ← Preset union type, TransformationStyle
```

### TransformationEngine

The central class for all text transformations. Provides three methods:

- `transform(text, style)` — Applies the transformation and returns the result
- `getStyleDisplayName(style)` — Returns the human-readable name for a style
- `getAllStyles()` — Returns all styles with labels and fixed preview examples

```typescript
const engine = new TransformationEngine()

engine.transform('Hello', 'strikethrough')  // → 'H̶e̶l̶l̶o̶'
engine.transform('Hello', 'bold')           // → '𝗛𝗲𝗹𝗹𝗼'
engine.getStyleDisplayName('upside-down')   // → 'Upside Down'
```

### transformationMaps

Contains all Unicode character mappings and the individual transformation functions:

- `applyStrikethrough(text)` — Adds combining stroke (U+0336) after each character
- `applyUpsideDown(text)` — Reverses string + flips each character via lookup table
- `applyMirror(text)` — Reverses string character order
- `applyBold(text)` — Maps to Mathematical Bold Unicode range (U+1D400)
- `applyItalic(text)` — Maps to Mathematical Italic Unicode range (U+1D434)
- `applyBoldItalic(text)` — Maps to Mathematical Bold Italic range (U+1D468)
- `applyScript(text)` — Maps to Mathematical Script range (U+1D49C)
- `applyCircled(text)` — Maps to Circled Latin Letters (U+24B6)
- `applySquared(text)` — Maps to Negative Squared Latin Letters (U+1F170)
- `applyMonospace(text)` — Maps to Mathematical Monospace range (U+1D670)
- `applyDoubleStruck(text)` — Maps to Mathematical Double-Struck range (U+1D538)
- `applyFullwidth(text)` — Maps to Fullwidth Forms range (U+FF21)
- `applySmallCaps(text)` — Maps lowercase to Small Caps Unicode equivalents

### Data Flow

```
User presses keyboard shortcut
        ↓
KeyboardShortcutHandler.handleKeyDown()
        ↓
Lookup preset in shortcutMap
        ↓
handleShortcut(preset)
        ↓
┌───────────────────────────────┐
│  preset.type === 'transformation' ?                   │
│                                                       │
│  YES → TransformationEngine.transform()  (sync)       │
│  NO  → TranslationEngine.translateText() (async)      │
└───────────────────────────────┘
        ↓
processText() applies result to:
  - Input selection
  - Input content (full)
  - Page selection (DOM)
```

### KeyboardShortcutHandler Integration

The handler uses a single unified `processText()` method that routes based on the `type` discriminator:

```typescript
private async processText(inputElement, text, preset, context) {
  let resultText: string

  if (preset.type === 'transformation') {
    // Synchronous — no await needed
    resultText = this.transformationEngine.transform(text, preset.transformationStyle)
  } else {
    // Asynchronous — API call
    resultText = await this.engine.translateText(text, preset.sourceLang, preset.targetLang)
  }

  // Apply result based on context (selection / content / page)
  // ...
}
```

---

## UI: PresetEditor

### Checkbox Toggle

A checkbox appears directly below the preset name field. Checking it switches the preset to transformation mode:

- **Unchecked** → Translation mode: shows Source Language + Target Language selectors
- **Checked** → Transformation mode: shows Style Selector + Live Preview

Toggling the checkbox converts the preset in place. Default values are applied:
- Translation → Transformation: defaults to `strikethrough`
- Transformation → Translation: defaults to `sourceLang: 'auto'`, `targetLang: 'en'`

### Style Selector

A `<select>` dropdown populated by `TransformationEngine.getAllStyles()`. Each option shows:

```
[Label] - [Fixed Example]
```

Example:
```
Strikethrough - E̶x̶a̶m̶p̶l̶e̶ ̶t̶e̶x̶t̶
Upside Down - ʇxǝʇ ǝlɯɐxƎ
Bold - 𝗘𝘅𝗮𝗺𝗽𝗹𝗲 𝗮𝗻𝗱 𝗮𝗹𝗹
```

The fixed examples use a hardcoded string (`"Example text"`) transformed at render time. They are static previews that do not change.

### Live Preview

Below the style selector, a two-part preview section appears:

1. **Text input** — User types any text they want to preview
2. **Output box** — Shows the transformed result in real time (computed property, no debounce)

The input text is saved as `exampleText` on the preset when the user clicks Save.

### Unsaved Changes Detection

The save/undo system works the same as for translation presets. For transformation presets, it compares:
- `name`
- `transformationStyle`
- `exampleText`
- `keyboardShortcut`

A type change (translation ↔ transformation) is always considered an unsaved change.

---

## Transformation Details

### Strikethrough

Uses **Unicode Combining Long Stroke Overlay** (U+0336). The combining character is appended after each character in the string:

```
H + U+0336 → H̶
e + U+0336 → e̶
```

**Support:** Excellent. Works on all modern platforms. Renders correctly in Discord, Reddit, Twitter, Gmail.

### Upside Down

Uses a **character lookup table** mapping each letter/number/punctuation to its flipped equivalent, then **reverses the string**:

```
'Hello' → reverse → 'olleH' → flip each char → 'ollo𝌆'
```

The lookup covers: a-z, A-Z, 0-9, and common punctuation (`.`, `,`, `?`, `!`, `(`, `)`, etc.). Characters without a mapping are kept as-is.

**Support:** Good. All platforms display it. Some characters may render differently depending on font.

### Mirror

Simply **reverses the character order** of the string. No character substitution:

```
'Hello World' → 'dlroW olleH'
```

**Support:** Universal. It's plain text with no special characters.

### Bold / Italic / Bold Italic / Script / Monospace / Double-Struck

These use **Mathematical Unicode ranges** in the Supplementary Multilingual Plane (SMP):

| Style | Uppercase Start | Lowercase Start |
|---|---|---|
| Bold | U+1D400 | U+1D41A |
| Italic | U+1D434 | U+1D44E |
| Bold Italic | U+1D468 | U+1D482 |
| Script | U+1D49C | U+1D4B6 |
| Monospace | U+1D670 | U+1D68A |
| Double-Struck | U+1D538 | U+1D552 |

Bold also maps numbers 0-9 (U+1D7CE). Characters outside the mapped ranges (punctuation, symbols) are kept as-is.

**Support:** Very good on modern systems. Requires surrogate pairs in UTF-16 (SMP characters), which can cause issues on very old systems.

### Circled

Maps letters to **Circled Latin Letters**:
- Uppercase A-Z → U+24B6 to U+24CF (Ⓐ-Ⓩ)
- Lowercase a-z → U+24D0 to U+24E9 (ⓐ-ⓩ)
- Numbers 0-9 → U+2460 to U+2468 + U+24EA (①-⑨, ⓪)

**Support:** Good. May render in color on some platforms (emoji-style).

### Squared

Uses **Negative Squared Latin Capital Letters** (U+1F170 block). Both uppercase and lowercase input map to the same squared character. Numbers are not mapped.

**Support:** Variable. These are emoji-adjacent characters. May render as colored blocks on some platforms, or may not render at all on older systems.

### Fullwidth

Maps characters to **Fullwidth Forms** (U+FF00 block). Originally designed for CJK text rendering. Also maps space to ideographic space (U+3000):

- Uppercase A-Z → U+FF21 to U+FF3A
- Lowercase a-z → U+FF41 to U+FF5A
- Numbers 0-9 → U+FF10 to U+FF19

**Support:** Excellent. This block has been in Unicode since version 1.1 (1993). Universal support.

### Small Caps

Maps lowercase letters to their **Small Capitals Unicode equivalents**. Uppercase input is converted to the small cap version of the same letter:

```
'Hello' → 'ʜEʟʟO'  (H→ʜ, e→ᴇ, l→ʟ, l→ʟ, o→ᴏ)
```

**Support:** Good on desktop. Some small cap characters are rare and may not be in all fonts.

---

## Platform Compatibility

### Highly Compatible (works everywhere)

- Strikethrough
- Mirror
- Fullwidth
- Bold / Italic / Bold Italic

### Good Compatibility (works on major platforms)

- Upside Down
- Script
- Monospace
- Double-Struck
- Small Caps
- Circled

### Variable Compatibility (depends on platform/font)

- Squared — emoji-adjacent, may render differently per platform

### SEO Impact

**These transformations should not be used in SEO-sensitive content.** Search engines do not interpret Mathematical Unicode characters as standard text. For example, `𝗯𝗼𝗹𝗱` is not indexed as the word "bold" by Google — it is treated as symbols.

For casual use (chat, social media, forums), there is no SEO concern.

---

## API Reference

### TransformationEngine

Located at `src/core/transformation/TransformationEngine.ts`.

#### `transform(text: string, style: TransformationStyle): string`

Applies the specified transformation to the input text. Returns the original text if `text` is empty or `style` is unknown.

```typescript
const engine = new TransformationEngine()
engine.transform('Hello World', 'bold') // → '𝗛𝗲𝗹𝗹𝗼 𝗪𝗼𝗿𝗹𝗱'
```

#### `getStyleDisplayName(style: TransformationStyle): string`

Returns the human-readable display name for a transformation style.

```typescript
engine.getStyleDisplayName('bold-italic') // → 'Bold Italic'
engine.getStyleDisplayName('upside-down') // → 'Upside Down'
```

#### `getStyleExample(style: TransformationStyle): string`

Returns a fixed example string (`"Example text"`) transformed with the given style. Used in the style selector dropdown.

```typescript
engine.getStyleExample('strikethrough') // → 'E̶x̶a̶m̶p̶l̶e̶ ̶t̶e̶x̶t̶'
```

#### `getAllStyles(): Array<{ value, label, example }>`

Returns all available transformation styles with their metadata. Used to populate the style selector in PresetEditor.

```typescript
engine.getAllStyles()
// [
//   { value: 'strikethrough', label: 'Strikethrough', example: 'E̶x̶a̶m̶p̶l̶e̶ ̶t̶e̶x̶t̶' },
//   { value: 'upside-down',  label: 'Upside Down',   example: 'ʇxǝʇ ǝlɯɐxƎ' },
//   ...
// ]
```

### usePresetsSettings (updated)

#### `addPreset(type?: 'translation' | 'transformation'): Preset | null`

Now accepts an optional `type` parameter. Defaults to `'translation'` for backward compatibility.

```typescript
const { addPreset } = usePresetsSettings()

const translationPreset = addPreset()                  // type: 'translation'
const transformPreset   = addPreset('transformation')  // type: 'transformation'
```

#### `updatePreset(preset: Preset): boolean`

Now accepts the `Preset` union type. Works identically for both translation and transformation presets.

---

## Troubleshooting

### Transformation not applying on keyboard shortcut

1. **Check the preset type** — open the popup, select the preset, verify the checkbox is checked
2. **Verify the shortcut** — make sure it doesn't conflict with another preset or the browser
3. **Reload the page** — the content script needs to be active on the current page
4. **Check the console** — look for `[KeyboardShortcut]` logs to see if the shortcut is being detected

### Transformed text displays as boxes or question marks

The target platform or application does not support the Unicode block used by that style. Try a different style:
- If `squared` doesn't render → try `circled` or `bold`
- If `script` doesn't render → try `italic`
- `strikethrough` and `fullwidth` are the most universally supported

### Style selector shows garbled text in the dropdown

The browser or OS font does not support the Mathematical Unicode ranges. This is a display issue in the popup only — the transformation still works correctly when applied to text on a page.

### Checkbox toggle resets languages

When switching from translation to transformation mode, language fields are replaced by transformation fields. Switching back resets to defaults (`auto` → `en`). The original language settings are not preserved across type toggles — save the preset before toggling if you want to keep your language configuration.

### Migration warning in console

```
[usePresetsSettings] Migrated presets to typed format
```

This is normal. It appears once when the extension loads presets that were created before the transformation feature was added. The migration adds `type: 'translation'` to existing presets and saves automatically. The warning does not appear again after the first save.

---

## Developer Notes

### Why synchronous transformations?

Translation requires an API call (async). Transformations are pure character mappings — O(n) string operations with no I/O. Making them synchronous simplifies the handler:

```typescript
if (preset.type === 'transformation') {
  resultText = this.transformationEngine.transform(text, preset.transformationStyle)
  // No await. No try/catch needed for network errors.
}
```

### Why a single `processText()` method?

The original handler had three separate methods: `translateInputSelection()`, `translateInputContent()`, `translatePageSelection()`. Each contained duplicated error handling and result-application logic. The unified `processText()` method:

- Accepts a `context` parameter (`'selection' | 'content' | 'page'`)
- Routes to the correct engine based on `preset.type`
- Applies the result based on context
- Single error handler with operation-aware messages

### Why not separate arrays for translation vs transformation presets?

Keeping both types in a single `presets[]` array simplifies:
- **Keyboard shortcut uniqueness** — one validation loop over one array
- **Active preset management** — one `activePresetId` field
- **UI rendering** — one loop in preset tabs
- **Storage** — one key, one migration path

The discriminated union (`preset.type`) provides full type safety via TypeScript narrowing:

```typescript
if (preset.type === 'transformation') {
  preset.transformationStyle // ✅ TypeScript knows this exists
  preset.sourceLang          // ❌ TypeScript error — doesn't exist on TransformationPreset
}
```

### Unicode ranges used

| Block | Range | Purpose |
|---|---|---|
| Mathematical Bold | U+1D400–U+1D433 | Bold letters + numbers |
| Mathematical Italic | U+1D434–U+1D467 | Italic letters |
| Mathematical Bold Italic | U+1D468–U+1D49B | Bold italic letters |
| Mathematical Script | U+1D49C–U+1D4CF | Script/cursive letters |
| Mathematical Monospace | U+1D670–U+1D6A3 | Monospace letters + numbers |
| Mathematical Double-Struck | U+1D538–U+1D56B | Double-struck letters + numbers |
| Circled Latin | U+24B6–U+24E9 | Circled letters |
| Negative Squared | U+1F170–U+1F189 | Squared letters |
| Fullwidth Forms | U+FF10–U+FF5A | Fullwidth letters + numbers |
| Combining Overlay | U+0336 | Strikethrough combining mark |

---

## Future Additions

Planned transformations to add in future versions, grouped by category.

### Encodings

Text converted to a different encoding or cipher format.

| Effect | Example | Notes |
|---|---|---|
| **Morse Code** | `Hello → .... . -.-- . ---` | Space-separated, words separated by `/` |
| **Braille** | `Hello → ⠓⠑⠇⠇⠕` | Unicode Braille Patterns block (U+2800). Good native support |
| **Binary** | `Hello → 01001000 01100101 ...` | UTF-8 byte representation |
| **Base64** | `Hello → SGVsbG8=` | Standard Base64 encoding |
| **ROT13** | `Hello → Uryyb` | Simple Caesar cipher with rotation of 13. Very fast to implement |
| **Hex** | `Hello → 48 65 6c 6c 6f` | Hexadecimal byte representation |

### Visual Effects

Text that remains "readable" but with a distorted or stylized appearance.

| Effect | Example | Notes |
|---|---|---|
| **Zalgo Text** | `Z̶̬̠̮̃̌̈́ȃ̶̡̛̰̝̈l̵̛̮̐̑g̷̶̛̺̻̞̓̃o̶̟̓̈́̚` | Uses random combining characters (accents, marks). Very popular on Discord/Reddit |
| **Zalgo Lite** | `Z̃á̑l̐g̓o` | Same concept, fewer combining marks. More readable |
| **Drunk Text** | `hOw dArE yOu` | Random uppercase/lowercase per character. The "Mocking Spongebob" meme format |

### Linguistic Transformations

Text modified according to language or encoding rules.

| Effect | Example | Notes |
|---|---|---|
| **Leet Speak** | `Hacker → H4ck3r` | Classic substitution: e→3, a→4, s→5, t→7, o→0. Very readable |
| **Pig Latin** | `Hello → Ellohay` | English-only. Move first consonant cluster to end + add "ay" |
| **Caesar Cipher** | `Hello (shift 3) → Khoor` | Configurable rotation. Extends naturally from ROT13 |

### Code Formatting

Text converted to common code identifier formats. Useful for developers.

| Effect | Example | Notes |
|---|---|---|
| **camelCase** | `my text here → myTextHere` | First word lowercase, subsequent words capitalized |
| **snake_case** | `my text here → my_text_here` | Words joined by underscores, all lowercase |
| **kebab-case** | `my text here → my-text-here` | Words joined by hyphens, all lowercase |
| **UPPER_CASE** | `my text here → MY_TEXT_HERE` | Snake case but all uppercase |
| **PascalCase** | `my text here → MyTextHere` | All words capitalized, no separator |

### Implementation Priority (suggested)

Based on compatibility and popularity:

1. **Morse** — canonical, highly requested
2. **Zalgo** — very popular on Discord/Reddit, visually spectacular
3. **Leet Speak** — classic, highly readable
4. **ROT13** — trivial to implement, well-known
5. **Braille** — Unicode native, good support, visually interesting
6. **Code formatting** (camelCase, snake_case, etc.) — practical for developers
7. **Drunk Text** — the Spongebob meme format, fun and easy
8. **Binary / Hex / Base64** — more niche, but complete the encoding set
9. **Pig Latin** — English-only limitation
10. **Caesar Cipher** — natural extension once ROT13 is done

---

## Related Files

- `/src/types/common.ts` — Preset union type, TransformationStyle, BasePreset
- `/src/core/transformation/TransformationEngine.ts` — Main transformation engine
- `/src/core/transformation/transformationMaps.ts` — Unicode mappings and apply functions
- `/src/core/handlers/KeyboardShortcutHandler.ts` — Unified processText() routing
- `/src/composables/usePresetsSettings.ts` — Migration and validation logic
- `/src/core/storage/SettingsManager.ts` — Storage type annotations
- `/src/components/PresetEditor.vue` — Checkbox toggle, style selector, live preview
- `/src/popup/Popup.vue` — Preset type annotation update
- `/src/core/utils/i18n.ts` — Transformation-related translation keys
- `/docs/MULTI_PRESETS.md` — Base preset system documentation
