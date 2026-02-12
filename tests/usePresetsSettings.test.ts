import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { usePresetsSettings } from '../src/composables/usePresetsSettings'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Flush the microtask queue so that pending Promises (e.g. loadFromStorage)
// complete before test assertions run.
const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

// ---------------------------------------------------------------------------
// usePresetsSettings CRUD
//
// NOTE: usePresetsSettings uses module-level shared state (singleton pattern
// — intentional for an extension where a single settings store is shared
// across the entire popup). Tests therefore run sequentially and build on
// each other's accumulated state, which mirrors real-world usage.
// ---------------------------------------------------------------------------

describe('usePresetsSettings CRUD', () => {
  beforeAll(async () => {
    // Wait for the module-level loadFromStorage() to complete.
    // chrome.storage.sync.get (mocked in tests/setup.ts) returns {} so the
    // composable falls back to its default state: 1 preset, shortcut Ctrl+Alt+T.
    await flushPromises()
  })

  afterAll(() => {
    // Clear any pending debounce timers so Vitest does not report leaks.
    vi.clearAllTimers()
  })

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('starts with exactly 1 default preset', () => {
    const { presetsSettings } = usePresetsSettings()
    expect(presetsSettings.value.presets).toHaveLength(1)
  })

  it('default preset uses Ctrl+Alt+T as keyboard shortcut', () => {
    const { presetsSettings } = usePresetsSettings()
    expect(presetsSettings.value.presets[0].keyboardShortcut).toBe('Ctrl+Alt+T')
  })

  // -------------------------------------------------------------------------
  // addPreset()
  // -------------------------------------------------------------------------

  it('addPreset() returns a new preset and increases count to 2', () => {
    const { addPreset, presetsSettings } = usePresetsSettings()
    const newPreset = addPreset()

    expect(newPreset).not.toBeNull()
    expect(presetsSettings.value.presets).toHaveLength(2)
  })

  it('addPreset() makes the new preset the active one', () => {
    const { presetsSettings } = usePresetsSettings()
    const lastPreset = presetsSettings.value.presets.at(-1)!
    expect(presetsSettings.value.activePresetId).toBe(lastPreset.id)
  })

  // -------------------------------------------------------------------------
  // updatePreset()
  // -------------------------------------------------------------------------

  it('updatePreset() changes the preset name and returns true', () => {
    const { updatePreset, presetsSettings } = usePresetsSettings()
    const original = presetsSettings.value.presets[1]
    const updated = { ...original, name: 'Renamed Preset' }

    const result = updatePreset(updated)

    expect(result).toBe(true)
    expect(presetsSettings.value.presets[1].name).toBe('Renamed Preset')
  })

  it('updatePreset() returns false for a non-existent preset id', () => {
    const { updatePreset, presetsSettings } = usePresetsSettings()
    const ghost = { ...presetsSettings.value.presets[0], id: 'non-existent-uuid' }
    expect(updatePreset(ghost)).toBe(false)
  })

  // -------------------------------------------------------------------------
  // deletePreset()
  // -------------------------------------------------------------------------

  it('deletePreset() removes the second preset and returns true', () => {
    const { deletePreset, presetsSettings } = usePresetsSettings()
    const idToDelete = presetsSettings.value.presets[1].id

    const result = deletePreset(idToDelete)

    expect(result).toBe(true)
    expect(presetsSettings.value.presets).toHaveLength(1)
  })

  it('deletePreset() refuses to delete the last remaining preset', () => {
    const { deletePreset, presetsSettings } = usePresetsSettings()
    const lastId = presetsSettings.value.presets[0].id

    const result = deletePreset(lastId)

    expect(result).toBe(false)
    expect(presetsSettings.value.presets).toHaveLength(1) // unchanged
  })

  it('deletePreset() falls back to first preset when the active preset is deleted', () => {
    const { addPreset, deletePreset, setActivePreset, presetsSettings } = usePresetsSettings()

    // Add a second preset and make it active
    const second = addPreset()!
    setActivePreset(second.id)
    expect(presetsSettings.value.activePresetId).toBe(second.id)

    // Deleting the active preset should select the first remaining preset
    deletePreset(second.id)
    expect(presetsSettings.value.activePresetId).toBe(presetsSettings.value.presets[0].id)
  })

  // -------------------------------------------------------------------------
  // validateShortcutUniqueness()
  // -------------------------------------------------------------------------

  it('validateShortcutUniqueness() returns valid when shortcut is unique', () => {
    const { validateShortcutUniqueness, presetsSettings } = usePresetsSettings()
    const currentId = presetsSettings.value.presets[0].id

    const result = validateShortcutUniqueness('Ctrl+Q', currentId)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('validateShortcutUniqueness() returns invalid when shortcut conflicts with another preset', () => {
    const { addPreset, validateShortcutUniqueness, presetsSettings } = usePresetsSettings()

    // Ensure there are 2 presets to create a potential conflict
    addPreset()
    const preset1 = presetsSettings.value.presets[0]
    const preset2 = presetsSettings.value.presets.at(-1)!

    // Try to assign preset1's shortcut to preset2 — should be a conflict
    const result = validateShortcutUniqueness(preset1.keyboardShortcut, preset2.id)

    expect(result.valid).toBe(false)
    expect(result.duplicatePreset?.id).toBe(preset1.id)
  })
})
