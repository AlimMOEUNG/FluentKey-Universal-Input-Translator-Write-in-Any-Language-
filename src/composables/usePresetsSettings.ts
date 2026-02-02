/**
 * Composable to manage multiple translation presets
 * Simpler approach: manual storage management with proper async initialization
 */

import { ref, watch } from 'vue'
import type { TranslationSettings } from './useSettings'
import type { TranslationPreset, PresetsSettings } from '@/types/common'

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate default keyboard shortcut for a preset index
 */
function generateDefaultShortcut(index: number): string {
  return index === 1 ? 'Alt+T' : `Alt+${index}+T`
}

/**
 * Create a default preset with specified index
 */
function createDefaultPreset(index: number): TranslationPreset {
  return {
    id: generateUUID(),
    name: `Preset ${index}`,
    sourceLang: 'auto',
    targetLang: 'en',
    keyboardShortcut: generateDefaultShortcut(index),
    createdAt: Date.now(),
  }
}

/**
 * Get default presets settings (single preset)
 */
function getDefaultPresetsSettings(): PresetsSettings {
  const defaultPreset = createDefaultPreset(1)

  return {
    presets: [defaultPreset],
    activePresetId: defaultPreset.id,
    provider: 'google',
  }
}

// Shared state
const presetsSettings = ref<PresetsSettings>(getDefaultPresetsSettings())
const isLoading = ref(true)
const isInitialized = ref(false)

// Debounce timer for saving
let saveTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Save to storage with debouncing (300ms)
 */
async function saveToStorage() {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }

  saveTimer = setTimeout(async () => {
    try {
      // Convert to plain object to avoid Vue Proxy serialization issues
      const plainData = JSON.parse(JSON.stringify(presetsSettings.value))
      await chrome.storage.sync.set({ presetsSettings: plainData })
      console.log('[usePresetsSettings] Saved to storage:', plainData)
    } catch (error) {
      console.error('[usePresetsSettings] Failed to save:', error)
    }
  }, 300)
}

/**
 * Validate presets settings structure
 */
function isValidPresetsSettings(data: any): data is PresetsSettings {
  const isValid =
    data &&
    typeof data === 'object' &&
    Array.isArray(data.presets) &&
    data.presets.length > 0 &&
    typeof data.activePresetId === 'string' &&
    typeof data.provider === 'string'

  if (!isValid) {
    console.warn('[usePresetsSettings] Invalid data structure:', {
      hasData: !!data,
      isObject: typeof data === 'object',
      hasPresets: data?.presets !== undefined,
      isPresetsArray: Array.isArray(data?.presets),
      presetsLength: data?.presets?.length,
      activePresetIdType: typeof data?.activePresetId,
      providerType: typeof data?.provider,
      data: data,
    })
  }

  return isValid
}

/**
 * Load from storage and perform migration if needed
 */
async function loadFromStorage() {
  try {
    const result = await chrome.storage.sync.get(['settings', 'presetsSettings'])

    // Case 1: New format exists and is valid
    if (result.presetsSettings && isValidPresetsSettings(result.presetsSettings)) {
      presetsSettings.value = result.presetsSettings
      console.log('[usePresetsSettings] Loaded from storage')
      return
    }

    // Case 1b: New format exists but is malformed
    if (result.presetsSettings && !isValidPresetsSettings(result.presetsSettings)) {
      console.warn('[usePresetsSettings] Malformed data in storage, resetting to defaults')
      presetsSettings.value = getDefaultPresetsSettings()
      await chrome.storage.sync.set({ presetsSettings: presetsSettings.value })
      return
    }

    // Case 2: Migration from old format
    if (result.settings) {
      const oldSettings: TranslationSettings = result.settings

      const migratedPreset: TranslationPreset = {
        id: generateUUID(),
        name: 'Preset 1',
        sourceLang: oldSettings.sourceLang,
        targetLang: oldSettings.targetLang,
        keyboardShortcut: oldSettings.keyboardShortcut,
        createdAt: Date.now(),
      }

      presetsSettings.value = {
        presets: [migratedPreset],
        activePresetId: migratedPreset.id,
        provider: oldSettings.provider,
      }

      // Save migrated settings
      await chrome.storage.sync.set({ presetsSettings: presetsSettings.value })
      await chrome.storage.sync.remove('settings')

      console.log('[usePresetsSettings] Migrated from old settings')
      return
    }

    // Case 3: No existing settings, save defaults
    await chrome.storage.sync.set({ presetsSettings: presetsSettings.value })
    console.log('[usePresetsSettings] Initialized with defaults')
  } catch (error) {
    console.error('[usePresetsSettings] Failed to load:', error)
    // On error, ensure defaults are set
    presetsSettings.value = getDefaultPresetsSettings()
  } finally {
    isLoading.value = false
    isInitialized.value = true
  }
}

// Initialize on first import
if (!isInitialized.value) {
  loadFromStorage()
}

/**
 * Listen for external storage changes
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.presetsSettings) {
    const newValue = changes.presetsSettings.newValue
    if (isValidPresetsSettings(newValue)) {
      presetsSettings.value = newValue
      console.log('[usePresetsSettings] Updated from external change')
    } else {
      console.warn('[usePresetsSettings] Received invalid data from external change, ignoring')
    }
  }
})

/**
 * Watch for changes and auto-save (registered once at module level)
 */
watch(
  presetsSettings,
  () => {
    if (!isLoading.value) {
      saveToStorage()
    }
  },
  { deep: true }
)

// Maximum number of presets allowed
const MAX_PRESETS = 10

/**
 * Composable to manage translation presets
 */
export function usePresetsSettings() {
  /**
   * Check if maximum presets limit is reached
   */
  function canAddPreset(): boolean {
    return presetsSettings.value.presets.length < MAX_PRESETS
  }

  /**
   * Find the next available preset number for keyboard shortcut
   * Tests numbers in circular order: preferred, preferred+1, ..., 10, 1, 2, ..., preferred-1
   */
  function findAvailablePresetNumber(preferredNumber: number): number {
    const existingShortcuts = presetsSettings.value.presets.map((p) =>
      p.keyboardShortcut.toLowerCase().trim()
    )

    console.log('[findAvailablePresetNumber] Starting search:', {
      preferredNumber,
      existingShortcuts,
      totalPresets: presetsSettings.value.presets.length,
    })

    // Test numbers in circular order using modulo
    for (let i = 0; i < MAX_PRESETS; i++) {
      const num = ((preferredNumber - 1 + i) % MAX_PRESETS) + 1
      const shortcut = (num === 1 ? 'alt+t' : `alt+${num}+t`).toLowerCase()

      console.log('[findAvailablePresetNumber] Testing:', {
        iteration: i,
        num,
        shortcut,
        isAvailable: !existingShortcuts.includes(shortcut),
      })

      if (!existingShortcuts.includes(shortcut)) {
        console.log('[findAvailablePresetNumber] Found available number:', num)
        return num
      }
    }

    // Fallback (should never happen if MAX_PRESETS=10)
    console.warn(
      '[findAvailablePresetNumber] No available slot found, using preferred:',
      preferredNumber
    )
    return preferredNumber
  }

  /**
   * Add a new preset with default values
   */
  function addPreset(): TranslationPreset | null {
    if (!canAddPreset()) {
      console.warn('[usePresetsSettings] Maximum presets limit reached')
      return null
    }

    const preferredIndex = presetsSettings.value.presets.length + 1
    const availableNumber = findAvailablePresetNumber(preferredIndex)
    const newPreset = createDefaultPreset(availableNumber)

    presetsSettings.value.presets.push(newPreset)
    presetsSettings.value.activePresetId = newPreset.id

    console.log('[usePresetsSettings] Added new preset:', newPreset)
    return newPreset
  }

  /**
   * Update an existing preset
   */
  function updatePreset(updatedPreset: TranslationPreset): boolean {
    const index = presetsSettings.value.presets.findIndex((p) => p.id === updatedPreset.id)

    if (index === -1) {
      console.error('[usePresetsSettings] Preset not found:', updatedPreset.id)
      return false
    }

    presetsSettings.value.presets[index] = updatedPreset
    console.log('[usePresetsSettings] Updated preset:', updatedPreset)
    return true
  }

  /**
   * Delete a preset (minimum 1 preset required)
   */
  function deletePreset(id: string): boolean {
    if (presetsSettings.value.presets.length <= 1) {
      console.warn('[usePresetsSettings] Cannot delete last preset')
      return false
    }

    const index = presetsSettings.value.presets.findIndex((p) => p.id === id)

    if (index === -1) {
      console.error('[usePresetsSettings] Preset not found:', id)
      return false
    }

    presetsSettings.value.presets.splice(index, 1)

    // If deleted preset was active, select first remaining preset
    if (presetsSettings.value.activePresetId === id) {
      presetsSettings.value.activePresetId = presetsSettings.value.presets[0].id
    }

    console.log('[usePresetsSettings] Deleted preset:', id)
    return true
  }

  /**
   * Get a preset by ID
   */
  function getPresetById(id: string): TranslationPreset | undefined {
    return presetsSettings.value.presets.find((p) => p.id === id)
  }

  /**
   * Get the active preset
   * Returns the first preset if activePresetId is null or doesn't exist
   */
  function getActivePreset(): TranslationPreset | undefined {
    if (!presetsSettings.value.activePresetId) {
      return presetsSettings.value.presets[0]
    }

    const preset = getPresetById(presetsSettings.value.activePresetId)

    // If the active preset doesn't exist (deleted or invalid), fall back to first preset
    if (!preset) {
      console.warn(
        `[usePresetsSettings] Active preset ${presetsSettings.value.activePresetId} not found, falling back to first preset`
      )
      // Update activePresetId to the first preset
      if (presetsSettings.value.presets.length > 0) {
        presetsSettings.value.activePresetId = presetsSettings.value.presets[0].id
        return presetsSettings.value.presets[0]
      }
    }

    return preset
  }

  /**
   * Set the active preset
   */
  function setActivePreset(id: string): boolean {
    const preset = getPresetById(id)

    if (!preset) {
      console.error('[usePresetsSettings] Preset not found:', id)
      return false
    }

    presetsSettings.value.activePresetId = id
    return true
  }

  /**
   * Validate shortcut uniqueness across all presets
   */
  function validateShortcutUniqueness(
    shortcut: string,
    currentPresetId: string
  ): { valid: boolean; error?: string; duplicatePreset?: TranslationPreset } {
    const normalized = shortcut.toLowerCase().trim()

    const duplicate = presetsSettings.value.presets.find(
      (p) => p.id !== currentPresetId && p.keyboardShortcut.toLowerCase().trim() === normalized
    )

    if (duplicate) {
      return {
        valid: false,
        error: `Shortcut already used by "${duplicate.name}"`,
        duplicatePreset: duplicate,
      }
    }

    return { valid: true }
  }

  return {
    presetsSettings,
    isLoading,
    addPreset,
    updatePreset,
    deletePreset,
    getPresetById,
    getActivePreset,
    setActivePreset,
    validateShortcutUniqueness,
    generateDefaultShortcut,
    canAddPreset,
    maxPresets: MAX_PRESETS,
  }
}
