# Multi-Presets Feature

## Overview

The multi-presets feature allows users to configure and manage multiple translation configurations (presets) within the extension. Each preset contains:

- **Source Language**: The language to translate from (or "auto" for auto-detection)
- **Target Language**: The language to translate to
- **Keyboard Shortcut**: A unique keyboard shortcut to trigger translation with this preset
- **Preset Name**: A customizable name for easy identification

Users can switch between presets using tabs in the popup UI and create as many presets as needed.

## Data Structure

### TranslationPreset

```typescript
interface TranslationPreset {
  id: string                 // Unique UUID identifier
  name: string              // User-defined name (e.g., "English to French")
  sourceLang: string        // Source language code (e.g., "en", "fr", "auto")
  targetLang: string        // Target language code (e.g., "en", "fr", "es")
  keyboardShortcut: string  // Keyboard shortcut (e.g., "Ctrl+Alt+T", "Ctrl+Alt+2")
  createdAt: number         // Timestamp of creation
}
```

### PresetsSettings

```typescript
interface PresetsSettings {
  presets: TranslationPreset[]      // Array of all presets
  activePresetId: string | null     // ID of currently active preset
  provider: TranslationProvider     // Global provider (shared across presets)
}
```

## Storage

All presets are stored in Chrome's sync storage under the key `presetsSettings`:

```javascript
chrome.storage.sync.get(['presetsSettings'], (result) => {
  console.log(result.presetsSettings)
  // {
  //   presets: [...],
  //   activePresetId: "uuid-here",
  //   provider: "google"
  // }
})
```

### Migration

The system automatically migrates from the old single-settings format to the new multi-presets format on first load.

**Old format:**
```javascript
{
  settings: {
    sourceLang: "auto",
    targetLang: "en",
    keyboardShortcut: "Ctrl+Alt+T",
    provider: "google"
  }
}
```

**New format:**
```javascript
{
  presetsSettings: {
    presets: [{
      id: "generated-uuid",
      name: "Preset 1",
      sourceLang: "auto",
      targetLang: "en",
      keyboardShortcut: "Ctrl+Alt+T",
      createdAt: 1234567890
    }],
    activePresetId: "generated-uuid",
    provider: "google"
  }
}
```

## Architecture

### Core Components

1. **`usePresetsSettings.ts`** - Main composable for preset management
   - Handles loading/saving to storage
   - Provides CRUD operations for presets
   - Validates data structure
   - Manages active preset state

2. **`PresetTabs.vue`** - Tab navigation component
   - Displays all presets as clickable tabs
   - Shows "+" button to add new presets
   - Displays provider selector on the right side

3. **`PresetEditor.vue`** - Preset editing component
   - Allows editing preset name, languages, and shortcut
   - Validates keyboard shortcut uniqueness
   - Manual save system (save button appears when changes detected)
   - Supports preset deletion (minimum 1 preset required)

4. **`KeyboardShortcutHandler.ts`** - Handles keyboard shortcuts
   - Maintains a Map of shortcuts to presets
   - Rebuilds shortcut map when presets change
   - Triggers translation with preset-specific languages

### Data Flow

```
User Action → PresetEditor → usePresetsSettings → Storage
                                     ↓
                          KeyboardShortcutHandler
                                     ↓
                          TranslationEngine (with preset languages)
```

## API Reference

### usePresetsSettings()

Main composable for managing presets.

**Returns:**
```typescript
{
  presetsSettings: Ref<PresetsSettings>,
  isLoading: Ref<boolean>,
  addPreset: () => TranslationPreset,
  updatePreset: (preset: TranslationPreset) => boolean,
  deletePreset: (id: string) => boolean,
  getPresetById: (id: string) => TranslationPreset | undefined,
  getActivePreset: () => TranslationPreset | undefined,
  setActivePreset: (id: string) => boolean,
  validateShortcutUniqueness: (shortcut: string, currentId: string) => ValidationResult,
  generateDefaultShortcut: (index: number) => string
}
```

**Functions:**

#### `addPreset()`
Adds a new preset with default values:
- Name: "Preset N" (where N is the index)
- Source Language: "auto"
- Target Language: "en"
- Keyboard Shortcut: "Ctrl+Alt+T" for first, "Ctrl+Alt+2" for second, etc.

```typescript
const newPreset = addPreset()
// Returns the newly created preset
```

#### `updatePreset(preset)`
Updates an existing preset. Returns `true` on success, `false` if preset not found.

```typescript
const success = updatePreset({
  id: "preset-uuid",
  name: "English to French",
  sourceLang: "en",
  targetLang: "fr",
  keyboardShortcut: "Ctrl+Alt+E",
  createdAt: 1234567890
})
```

#### `deletePreset(id)`
Deletes a preset by ID. Returns `false` if attempting to delete the last preset (minimum 1 required).

```typescript
const success = deletePreset("preset-uuid")
```

#### `getActivePreset()`
Returns the currently active preset.

```typescript
const activePreset = getActivePreset()
if (activePreset) {
  console.log(`Active: ${activePreset.name}`)
}
```

#### `setActivePreset(id)`
Sets the active preset. Returns `true` on success.

```typescript
setActivePreset("preset-uuid")
```

#### `validateShortcutUniqueness(shortcut, currentId)`
Validates that a keyboard shortcut is not already used by another preset.

```typescript
const validation = validateShortcutUniqueness("Ctrl+Alt+T", currentPresetId)
if (!validation.valid) {
  console.error(validation.error)
  // "Shortcut already used by 'Preset 1'"
}
```

## Default Presets

When initializing for the first time, a single default preset is created:

```typescript
{
  id: "generated-uuid",
  name: "Preset 1",
  sourceLang: "auto",
  targetLang: "en",
  keyboardShortcut: "Alt+T",
  createdAt: Date.now()
}
```

## Keyboard Shortcuts

### Format

Shortcuts must follow this pattern:
```
(Ctrl|Alt|Shift|Meta)(+(Ctrl|Alt|Shift|Meta))*+[A-Z0-9]+
```

**Valid examples:**
- `Ctrl+Alt+T`
- `Ctrl+Shift+E`
- `Ctrl+Alt+2`
- `Meta+F`

**Invalid examples:**
- `alt+t` (must be capitalized)
- `T` (must include modifier key)
- `Alt+` (missing final key)

### Uniqueness

Shortcuts are validated for uniqueness across all presets. The validation is case-insensitive, so `Alt+T` and `alt+t` are considered duplicates.

### Default Shortcuts

- Preset 1: `Ctrl+Alt+T`
- Preset 2: `Ctrl+Alt+2`
- Preset 3: `Ctrl+Alt+3`
- And so on...

## UI Components

### PresetTabs

**Props:**
```typescript
{
  presets: TranslationPreset[],
  activePresetId: string | null,
  provider: string
}
```

**Events:**
```typescript
{
  'select-preset': (id: string) => void,
  'add-preset': () => void,
  'toggle-provider': () => void
}
```

### PresetEditor

**Props:**
```typescript
{
  preset: TranslationPreset,
  allPresets: TranslationPreset[],
  canDelete: boolean
}
```

**Events:**
```typescript
{
  'update-preset': (preset: TranslationPreset) => void,
  'delete-preset': (id: string) => void
}
```

## Manual Save System

To prevent Chrome storage quota errors (`MAX_WRITE_OPERATIONS_PER_MINUTE`), the preset editor uses a manual save system:

1. User modifies preset fields (name, languages, shortcut)
2. Changes are stored locally in component state
3. A "Save" button appears when unsaved changes are detected
4. A warning banner shows at the bottom: "Unsaved changes"
5. User clicks "Save" to persist changes to storage
6. Only one storage write occurs per save action

**Benefits:**
- Prevents quota exhaustion from auto-save on every keystroke
- Gives user control over when changes are committed
- Clear visual feedback about unsaved state

## Storage Optimization

### Debouncing

Storage saves are debounced by 300ms to group multiple rapid changes into a single write operation.

```typescript
// Multiple rapid changes...
presetsSettings.value.presets[0].name = "New name"
presetsSettings.value.presets[1].targetLang = "fr"
// ...result in only ONE storage write after 300ms
```

### Plain Object Conversion

Vue reactivity wraps objects in Proxy instances. Before saving, data is converted to plain objects using `JSON.parse(JSON.stringify())` to ensure proper serialization:

```typescript
const plainData = JSON.parse(JSON.stringify(presetsSettings.value))
await chrome.storage.sync.set({ presetsSettings: plainData })
```

## Troubleshooting

### "Invalid data structure" warnings

If you see warnings about invalid data structure:

1. **Check the console logs** for detailed validation info
2. **Clear storage** and reload:
   ```javascript
   chrome.storage.sync.remove('presetsSettings')
   ```
3. **Uninstall and reinstall** the extension

### Presets not persisting

If changes are lost after closing the popup:

1. **Ensure you clicked "Save"** (manual save system)
2. **Check for quota errors** in console
3. **Verify storage permissions** in manifest.json

### Keyboard shortcuts not working

If shortcuts don't trigger translation:

1. **Check for duplicate shortcuts** (use validation)
2. **Reload the extension** to rebuild shortcut map
3. **Verify shortcut format** matches pattern requirements
4. **Check content script is injected** on the page

### Provider misconfigured — only translation presets fail

If the global provider is misconfigured (e.g. ChatGPT without an API key), `transformation`, `custom-transform`, and `llm-prompt` presets with a custom provider will still work. Only `translation` presets that rely on the global provider will return an error. Check the browser console for:

```
[TranslationEngine] Provider 'chatgpt' unavailable: ...
```

Fix the API key in the Provider tab — the provider will reinitialize automatically.

### Migration issues

If migrating from old single-settings format fails:

1. **Check console** for migration logs
2. **Manually clear old settings**:
   ```javascript
   chrome.storage.sync.remove('settings')
   ```
3. **Reload extension** to trigger fresh initialization

## Developer Notes

### Why Singleton State?

The `usePresetsSettings` composable uses singleton state at the module level (not inside the function). This ensures:

- State is shared across all component instances
- Watch handlers are registered only once
- Storage listeners don't multiply on component re-mounts
- No race conditions from multiple initialization attempts

### Why Manual Save?

Auto-save on every field change caused Chrome storage quota errors:

```
Error: This request exceeds the MAX_WRITE_OPERATIONS_PER_MINUTE quota.
```

Chrome limits sync storage to **120 writes per minute**. With auto-save:
- Typing a preset name → 10+ writes in seconds
- Changing 3 fields → 3 writes
- Opening popup multiple times → multiple initializations

Manual save ensures controlled, intentional storage writes.

### Vue Reactivity Gotchas

**Problem:** Direct mutations don't always trigger watchers

```typescript
// ❌ May not trigger watcher
presetsSettings.value.presets.push(newPreset)

// ✅ Works with deep watch
watch(presetsSettings, () => { ... }, { deep: true })
```

**Problem:** Vue Proxy objects can serialize incorrectly

```typescript
// ❌ Proxy may not serialize properly
chrome.storage.sync.set({ presetsSettings: presetsSettings.value })

// ✅ Convert to plain object first
const plain = JSON.parse(JSON.stringify(presetsSettings.value))
chrome.storage.sync.set({ presetsSettings: plain })
```

## Future Improvements

Potential enhancements for the multi-presets system:

1. **Import/Export** - Allow users to export presets as JSON and import them
2. **Preset Ordering** - Drag-and-drop to reorder tabs
3. **Preset Cloning** - Duplicate an existing preset as a starting point
4. **Preset Groups** - Organize presets into categories/folders
5. **Shortcut Recorder** - Visual keyboard shortcut capture instead of text input
6. **Preset Icons** - Custom icons or colors for visual differentiation
7. **Usage Statistics** - Track which presets are used most frequently
8. **Cloud Sync** - Sync presets across devices via Chrome sync (already implemented) or external service
9. **Preset Templates** - Pre-configured presets for common language pairs
10. **Bulk Operations** - Select and delete/modify multiple presets at once

## Related Files

- `/src/composables/usePresetsSettings.ts` - Main preset management logic
- `/src/components/PresetTabs.vue` - Tab navigation UI
- `/src/components/PresetEditor.vue` - Preset editing UI
- `/src/popup/Popup.vue` - Main popup integration
- `/src/core/handlers/KeyboardShortcutHandler.ts` - Keyboard shortcut handling
- `/src/core/translation/TranslationEngine.ts` - Translation execution
- `/src/types/common.ts` - TypeScript type definitions
