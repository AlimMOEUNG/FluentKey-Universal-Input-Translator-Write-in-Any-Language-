# Draft Persistence for Preset Editor

## Overview

When a user starts editing a preset (unsaved changes exist), the working state is automatically persisted to `chrome.storage.local`. This allows the editor state to survive popup close/reopen and preset tab switching within the same popup session.

## Behaviour

| Action | Result |
|--------|--------|
| Edit preset → close popup → reopen | Draft restored, editor shows unsaved state |
| Edit preset → switch to another preset tab → come back | Draft restored for original preset |
| Edit preset → click **Undo** | Draft cleared, editor reverts to saved state |
| Edit preset → click **Save** | Draft cleared after successful save |
| Edit preset X on Tab A, then edit preset Y on Tab B | Tab A's draft is silently overwritten; if Tab A reopens, preset X shows its saved state (implicit undo) |

## Architecture

### New file: `src/composables/useDraftPreset.ts`

Exposes three functions:

- **`loadDraft()`** — reads `presetDraft` key from `chrome.storage.local`; returns `null` on error or if nothing is stored
- **`saveDraft(state)`** — writes the full editor state to `chrome.storage.local`; errors are non-fatal
- **`clearDraft()`** — removes the `presetDraft` key; errors are non-fatal

```typescript
export interface DraftPresetState {
  presetId: string              // Which preset the draft belongs to
  localPreset: Preset           // Full working copy of the preset
  presetConfig: PresetProviderConfig  // Custom provider config (translation type)
  llmModelSelection: string     // Dropdown value, can be 'custom'
  llmCustomModelInput: string   // Free-text model name when selection='custom'
  customExampleText: string     // Preview text (transformation / custom-transform type)
  savedAt: number               // Unix timestamp
}
```

**Why `chrome.storage.local` and not `sync`:** Draft state is device-specific in-progress work, not user data that should roam across devices.

**Why not `useStorageState`:** That composable auto-syncs external storage changes reactively, which would bleed a draft written by another tab into the current editor session. It also lacks debounce support.

### Changes in `src/components/PresetEditor.vue`

#### Auto-save (debounced)

Five watchers trigger `scheduleDraftSave()` whenever any editor field changes:

```
localPreset       (deep)
presetConfig      (deep)
llmModelSelection
llmCustomModelInput
customExampleText
```

`scheduleDraftSave()` debounces writes by **400 ms** and includes a guard: if `hasUnsavedChanges` is `false` at write time, the save is skipped (prevents writing a spurious draft after a reset or save). It also updates `memoryCachedDraft` synchronously before the async storage write.

#### Memory cache (`memoryCachedDraft`)

A `ref<DraftPresetState | null>` kept in sync with storage at all times:

| Operation | Cache update |
|-----------|-------------|
| `scheduleDraftSave()` fires | Set to the new state (sync, before `saveDraft`) |
| `restoreDraftIfValid()` loads a valid draft | Set to the loaded draft |
| `undoChanges()` | Set to `null` |
| `savePreset()` | Set to `null` |

This mirror exists so that the preset-switch watcher can restore state in the same synchronous tick, avoiding the two-render flash that would occur with an async storage read.

#### Draft restore

Two code paths, one shared helper:

- **`applyDraft(draft)`** — pure synchronous function that writes a validated `DraftPresetState` into the editor refs (`localPreset`, `presetConfig`, `llmModelSelection`, etc.)

- **`restoreDraftIfValid()`** — async, called only from `onMounted`. Reads from storage, validates, populates `memoryCachedDraft`, then calls `applyDraft`. No flash risk here since the component is still mounting.

- **`restoreDraftFromCache(presetId)`** — sync, called from the `watch(props.preset, ...)` callback. Reads from `memoryCachedDraft`. If the cached draft matches `presetId` and is valid, calls `applyDraft` immediately in the same tick → **no visual flash**.

#### Draft clear

The draft is explicitly cleared (storage + memory cache) in two places:
- **`undoChanges()`** — user explicitly discards edits
- **`savePreset()`** — after emitting `update-preset`

## Storage key

```
chrome.storage.local  →  key: "presetDraft"
```

Single global slot. Only one preset draft can exist at a time. Starting to edit a different preset overwrites the previous draft.

## Edge Cases

| Case | Behaviour |
|------|-----------|
| Draft belongs to a deleted preset | `presetId` mismatch on any remaining preset → silently ignored, overwritten on next edit |
| Malformed draft data | Structural check fails → `clearDraft()` called, falls back to saved state |
| No active preset | `<PresetEditor>` is not mounted → no impact |
| Save fails mid-way | Draft remains in storage; next open will re-offer the in-progress state |
