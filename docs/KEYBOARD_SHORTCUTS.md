# Keyboard Shortcuts Logic

This document explains the keyboard shortcut system implemented in Simple Input Translator, including the design decisions and conflict prevention mechanisms.

---

## Problem Statement

### The Conflict Issue

When supporting multi-key sequences (e.g., `Ctrl+Alt+T+1`), a critical problem arises with **prefix conflicts**:

**Example of the problem:**
```
Preset 1: Ctrl+Alt+T          (translate to English)
Preset 2: Ctrl+Alt+T+1        (translate to French)
```

**What happens when user presses `Ctrl+Alt+T`?**
1. User presses `Ctrl+Alt+T`
2. System immediately detects `Ctrl+Alt+T` shortcut
3. Preset 1 is triggered instantly ✅
4. User **cannot** proceed to press `1` → Preset 2 becomes unreachable ❌

This is called a **prefix conflict**: one shortcut is a prefix of another, making the longer sequence impossible to trigger.

---

## Solution: Smart Conflict Prevention

### Design Principles

1. **Proactive validation**: Prevent conflicts at configuration time, not at runtime
2. **Clear UX feedback**: Show explicit error messages explaining why a shortcut is invalid
3. **Safe defaults**: Use shortcuts that cannot conflict with each other
4. **No modifier-only shortcuts**: Prevent `Alt`, `Ctrl`, etc. alone to avoid conflicts

---

## Rules & Constraints

### ✅ Allowed Shortcuts

| Format | Example | Description |
|--------|---------|-------------|
| Modifier + Key | `Ctrl+Alt+T`, `Ctrl+1`, `Shift+A` | Single modifier + single key |
| Multiple Modifiers + Key | `Ctrl+Shift+A`, `Ctrl+Alt+T` | Multiple modifiers + single key |
| Modifier + 2 Keys | `Ctrl+Alt+T+1`, `Alt+1+2` | Modifier + 2 keys (sequence) |

### ❌ Forbidden Shortcuts

| Format | Example | Reason |
|--------|---------|--------|
| Modifier only | `Alt`, `Ctrl`, `Shift` | Not a valid shortcut |
| Key only | `T`, `1`, `A` | No modifier = not a valid shortcut |
| Too many keys | `Alt+A+B+C` | Max 2 keys after modifiers |

### 🔍 Conflict Detection

The system detects **3 types of conflicts**:

#### 1. Exact Duplicate
```
Existing: Ctrl+Alt+T (Preset "English")
New:      Ctrl+Alt+T ❌

Error: "Shortcut already used by 'English'"
```

#### 2. Prefix Conflict (Type A)
```
Existing: Ctrl+Alt+T (Preset "English")
New:      Ctrl+Alt+T+1 ❌

Error: "The shortcut 'Ctrl+Alt+T+1' conflicts with 'Ctrl+Alt+T' used by 'English'.
When you press 'Ctrl+Alt+T', it will be triggered immediately and you won't
be able to use 'Ctrl+Alt+T+1'."
```

#### 3. Prefix Conflict (Type B)
```
Existing: Ctrl+Alt+T+1 (Preset "French")
New:      Ctrl+Alt+T ❌

Error: "The shortcut 'Ctrl+Alt+T' conflicts with 'Ctrl+Alt+T+1' used by 'French'.
When you press 'Ctrl+Alt+T', it will be triggered immediately and you won't
be able to use 'Ctrl+Alt+T+1'."
```

---

## Default Shortcuts Strategy

### Why `Ctrl+Alt+...`?

Plain `Alt+N` shortcuts conflict with Chrome's tab-switching shortcuts on Linux (Ctrl+N) and GNOME desktop shortcuts that capture `Alt+N` before the browser even sees the event. `Ctrl+Alt` combinations are safe across Chrome, Firefox, and major OS/DE combinations.

### First Preset: `Ctrl+Alt+T`
- **Intuitive**: `T` for "Translate"
- **Easy to remember**: Most common use case gets simplest shortcut
- **Safe**: No conflicts with OS or browser shortcuts

### Following Presets: `Ctrl+Alt+2`, `Ctrl+Alt+3`, `Ctrl+Alt+4`, etc.
- **No conflicts**: Each shortcut is independent
- **Matches preset number**: Preset 2 gets `Ctrl+Alt+2`, Preset 3 gets `Ctrl+Alt+3`, etc.
- **Simple pattern**: Easy to memorize
- **Scalable**: Can go from `Ctrl+Alt+2` to `Ctrl+Alt+9` (and beyond)

### Example Default Configuration
```
Preset 1: Ctrl+Alt+T    → Translate to English
Preset 2: Ctrl+Alt+2    → Translate to French
Preset 3: Ctrl+Alt+3    → Translate to Spanish
Preset 4: Ctrl+Alt+4    → Translate to German
```

---

## Implementation Details

### Validation Flow

```
User enters shortcut → Normalize format → Check rules → Check conflicts → Save or Reject
```

**Step 1: Normalize Format**
- Convert to standard format: `Ctrl+Alt+Shift+Meta+Key1(+Key2)`
- Uppercase single characters: `ctrl+alt+t` → `Ctrl+Alt+T`
- Sort multi-keys alphabetically: `Ctrl+Alt+T+1` → `Ctrl+Alt+1+T`

**Step 2: Check Rules**
- ❌ Reject if modifier-only
- ❌ Reject if no modifier
- ❌ Reject if more than 2 keys

**Step 3: Check Conflicts**
- ❌ Reject if exact duplicate
- ❌ Reject if new is prefix of existing
- ❌ Reject if existing is prefix of new

**Step 4: Save or Reject**
- ✅ Save if all checks pass
- ❌ Show error dialog if any check fails

### Conflict Detection Algorithm

```typescript
function detectConflict(newShortcut, existingPresets) {
  for (preset of existingPresets) {
    existing = preset.keyboardShortcut

    // Check if new is prefix of existing
    if (existing.startsWith(newShortcut + '+')) {
      return CONFLICT
    }

    // Check if existing is prefix of new
    if (newShortcut.startsWith(existing + '+')) {
      return CONFLICT
    }

    // Check exact duplicate
    if (newShortcut === existing) {
      return DUPLICATE
    }
  }

  return NO_CONFLICT
}
```

---

## User Experience

### Creating a New Preset

**Scenario 1: Valid Shortcut**
```
User enters: Ctrl+Alt+5
Validation: ✅ Pass
Result: Shortcut saved, preset activated
```

**Scenario 2: Modifier-Only Shortcut**
```
User enters: Alt
Validation: ❌ Fail
Error message: "Modifier-only shortcuts (Alt, Ctrl, etc.) are not allowed to prevent conflicts"
Result: Save button disabled, error displayed
```

**Scenario 3: Prefix Conflict**
```
Existing presets:
  - Preset "English": Ctrl+Alt+T

User enters: Ctrl+Alt+T+1
Validation: ❌ Fail
Error dialog: "Keyboard Shortcut Conflict
              The shortcut 'Ctrl+Alt+T+1' conflicts with 'Ctrl+Alt+T' used by 'English'.
              Please remove or modify 'English' first, or choose a different shortcut."
Result: Save blocked, dialog displayed with clear instructions
```

### Editing an Existing Preset

**Scenario: Creating a Conflict**
```
Existing presets:
  - Preset "English": Ctrl+Alt+T
  - Preset "French": Ctrl+Alt+1

User edits "French" to: Ctrl+Alt+T+1
Validation: ❌ Fail
Error dialog: Explains conflict with "English"
Result: Changes not saved, user must choose different shortcut
```

---

## Best Practices

### ✅ Recommended Shortcuts

**For most users:**
- Use `Ctrl+Alt` combos: `Ctrl+Alt+T`, `Ctrl+Alt+2`, `Ctrl+Alt+3`
- Avoid complex sequences unless needed
- Keep shortcuts memorable

**For power users:**
- Use sequences for related actions: `Ctrl+Alt+T+E` (translate English), `Ctrl+Alt+T+F` (translate French)
- Keep first key consistent for grouped presets

### ❌ Avoid These Patterns

**Don't create prefix hierarchies:**
```
❌ Ctrl+Alt+T
❌ Ctrl+Alt+T+1
❌ Ctrl+Alt+T+2
→ Ctrl+Alt+T blocks all others
```

**Better alternative:**
```
✅ Ctrl+Alt+T
✅ Ctrl+Alt+2
✅ Ctrl+Alt+3
→ All independent shortcuts
```

---

## Technical Notes

### Files Modified

1. **`src/core/utils/keyboardUtils.ts`**
   - `buildShortcutFromEvent()`: Rejects modifier-only shortcuts
   - `normalizeShortcut()`: Rejects modifier-only and validates format
   - `KeyboardSequenceDetector`: Updated to reject modifier-only sequences

2. **`src/components/PresetEditor.vue`**
   - `validateShortcut()`: Added prefix conflict detection
   - Integration with `ConfirmDialog` for error display

3. **`src/core/storage/SettingsManager.ts`**
   - Default preset uses `Ctrl+Alt+T`

4. **`src/composables/usePresetsSettings.ts`**
   - `generateDefaultShortcut()`: First preset gets `Ctrl+Alt+T`, others get `Ctrl+Alt+2`, `Ctrl+Alt+3`, etc.

5. **`src/core/utils/i18n.ts`**
   - Added `shortcutModifierOnly` translation
   - Added `shortcutConflictTitle` translation

### Permutation Handling

Multi-key sequences are normalized to alphabetical order to handle permutations:
```
Ctrl+Alt+T+1 → normalized to → Ctrl+Alt+1+T
Ctrl+Alt+1+T → normalized to → Ctrl+Alt+1+T
→ Both treated as same shortcut
```

This ensures that `Ctrl+Alt+T+1` and `Ctrl+Alt+1+T` (pressed in different order) are recognized as the same shortcut.

---

## Future Improvements

Potential enhancements for future versions:

1. **Auto-suggestion**: Suggest next available shortcut when conflict detected
2. **Visual conflict indicator**: Show conflicting presets directly in the preset list
3. **One-click conflict resolution**: Allow user to remove/modify conflicting preset from error dialog
4. **Shortcut templates**: Preset patterns for common use cases (translation languages, text transformations, etc.)
5. **Import/Export**: Share shortcut configurations between installations

---

## FAQ

**Q: Why can't I use `Alt` alone?**
A: Modifier-only shortcuts conflict with all shortcuts starting with that modifier. This makes other shortcuts unreachable.

**Q: Why `Ctrl+Alt` instead of just `Alt`?**
A: Plain `Alt+N` conflicts with Chrome's tab shortcuts (Ctrl+N) and GNOME/OS shortcuts that capture `Alt+N` at the system level before Chrome sees the event.

**Q: Why is `Ctrl+Alt+T+1` blocked when `Ctrl+Alt+T` exists?**
A: When you press `Ctrl+Alt+T`, it triggers immediately. The browser never waits to see if you'll press another key. This makes `Ctrl+Alt+T+1` impossible to trigger.

**Q: Can I use sequences like `Ctrl+Alt+T+1`?**
A: Yes, but only if `Ctrl+Alt+T` is **not** already assigned to another preset. The system validates this automatically.

**Q: What's the maximum number of keys?**
A: Modifier + 2 keys maximum (e.g., `Ctrl+Alt+T+1`). This keeps shortcuts simple and prevents complexity.

**Q: Can I use `Numpad` keys?**
A: Yes, numpad digits are normalized to regular digits. `Numpad1` becomes `1` for consistency.

**Q: What happens if I edit a shortcut and create a conflict?**
A: The validation runs immediately. A dialog appears explaining the conflict, and the save is blocked until you choose a different shortcut.

---

## Summary

The keyboard shortcut system prevents conflicts through:

1. **Strict validation rules**: No modifier-only, max 2 keys
2. **Prefix conflict detection**: Prevents unreachable shortcuts
3. **Safe defaults**: `Ctrl+Alt+T`, `Ctrl+Alt+2`, `Ctrl+Alt+3`, etc.
4. **Clear error messages**: Users understand why shortcuts are rejected
5. **Proactive UX**: Problems caught at configuration time, not runtime

This ensures a reliable, predictable shortcut system where every configured shortcut is guaranteed to work.

---

## Word Selection Shortcut (Modifier+Arrow)

### Overview

In addition to translation shortcuts, the extension provides a **word-by-word selection** shortcut that works in any focused text field (input, textarea, contenteditable).

| Action | Shortcut (default) | Result |
|--------|--------------------|--------|
| Select next word | `Alt+→` | Extends or shrinks selection one word to the right |
| Select previous word | `Alt+←` | Extends or shrinks selection one word to the left |

The modifier key (`Alt` by default) is configurable in the **Global** tab of the extension popup.

---

### Configurable Modifier

The modifier can be changed to any of:

| Value | Key pressed |
|-------|-------------|
| `Alt` | Alt (default) |
| `Ctrl` | Ctrl/Control |
| `Shift` | Shift |
| `Meta` | Cmd (macOS) / Windows key |

The setting is stored in `presetsSettings.selectionModifier` (chrome.storage.sync) and applied immediately without a page reload.

---

### Selection Behavior

The shortcut mirrors the native browser `Selection.modify('extend', direction, 'word')` behavior:

#### Collapsed cursor (no existing selection)

| Cursor position | Key | Result |
|-----------------|-----|--------|
| Start of word `\|word` | `→` | Selects `word`, cursor at end |
| Middle of word `wo\|rd` | `→` | Selects entire `word`, cursor at end |
| Middle of word `wo\|rd` | `←` | Selects entire `word`, cursor at start |
| End of word `word\|` | `←` | Selects `word`, cursor at start |
| On whitespace | `→` | Selects next word, cursor at its end |
| On whitespace | `←` | Selects previous word, cursor at its start |

#### With existing selection (directional shrink/extend)

The selection has a **direction** (anchor → focus):

- **Forward selection** (left-to-right): `→` extends the end forward; `←` shrinks the end backward
- **Backward selection** (right-to-left): `←` extends the start backward; `→` shrinks the start forward

This exactly mirrors how `Shift+Ctrl+→` / `Shift+Ctrl+←` work natively, preserving the anchor point.

---

### Event Handling

The handler registers on the **capture phase** (`{ capture: true }`) so it runs before any page-level listeners (Reddit, Google Docs, etc.) and calls:

```typescript
event.preventDefault()
event.stopPropagation()
event.stopImmediatePropagation()
```

This prevents the host page from intercepting the key combination.

---

### Shadow DOM Support

`document.activeElement` stops at the shadow host boundary. The handler traverses shadow roots recursively to find the truly focused element:

```typescript
private getDeepActiveElement(): Element | null {
  let element: Element | null = document.activeElement
  while (element?.shadowRoot) {
    element = element.shadowRoot.activeElement
  }
  return element
}
```

This ensures the shortcut works inside Shadow DOM contexts (e.g. Reddit DMs, custom web components).

---

### Implementation Details

#### Files involved

| File | Role |
|------|------|
| `src/core/handlers/input/WordSelectionHandler.ts` | Core handler class |
| `src/core/storage/SettingsManager.ts` | `getSelectionModifier()` method |
| `src/content-script.ts` | Instantiation, initialization, live settings update |
| `src/components/ProviderTab.vue` | Modifier selector UI in the Global tab |
| `src/types/common.ts` | `SelectionModifier` union type, `PresetsSettings.selectionModifier` field |
| `src/core/utils/i18n.ts` | `selectionModifierLabel`, `selectionModifierHelp`, `selectionModifierExample` keys |

#### `WordSelectionHandler` class structure

```
WordSelectionHandler
├── initialize()              Register capture-phase keydown listener
├── destroy()                 Remove listener (uses stored bound reference)
├── setModifier(modifier)     Update modifier key at runtime
├── enable() / disable()      Toggle handler on/off
│
├── handleKeyDown()           Entry point — checks modifier + editable target
├── isModifierActive()        Checks the right event.xxxKey for each modifier
├── getDeepActiveElement()    Traverses shadow roots to find real focused element
│
├── selectNextWord()          Dispatch to input or contenteditable path
├── selectPreviousWord()      Dispatch to input or contenteditable path
│
├── selectNextWordInInput()         input/textarea: respects selectionDirection
├── selectPreviousWordInInput()     input/textarea: respects selectionDirection
├── selectNextWordInContentEditable()     uses selection.modify('extend','forward','word')
├── selectPreviousWordInContentEditable() uses selection.modify('extend','backward','word')
│
├── findCurrentWordStart()    Walk backward to start of current word
├── findCurrentWordEnd()      Walk forward to end of current word
├── findNextWordBoundary()    Skip current word + whitespace + next word
├── findPreviousWordBoundary() Walk back past whitespace + previous word
├── isWordChar()              [\w\u00C0-\u024F\u1E00-\u1EFF]
└── isWhitespace()            \s
```

#### `selectionDirection` usage for `input`/`textarea`

Unlike `contenteditable` (which uses the native Selection API anchor/focus model), `input` and `textarea` elements expose `selectionDirection` (`'forward'` | `'backward'` | `'none'`). The handler reads this to decide which end of the selection is "active":

```
direction = 'forward'  → active end is selectionEnd   → → extends end, ← shrinks end
direction = 'backward' → active end is selectionStart → ← extends start, → shrinks start
direction = 'none'     → collapsed cursor              → use cursor position
```

`setSelectionRange(start, end, direction)` is always used (not direct property assignment) to explicitly preserve the direction for subsequent keypresses.
