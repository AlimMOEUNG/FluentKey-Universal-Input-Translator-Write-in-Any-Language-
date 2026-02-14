/**
 * Composable to manage multiple translation presets
 * Simpler approach: manual storage management with proper async initialization
 */

import { ref, watch, computed } from 'vue'
import type { TranslationSettings } from './useSettings'
import type {
  Preset,
  TranslationPreset,
  TransformationPreset,
  CustomTransformPreset,
  LLMPromptPreset,
  PresetsSettings,
} from '@/types/common'
import { normalizeShortcut } from '@/core/utils/keyboardUtils'
import {
  getDefaultModel,
  PREDEFINED_MODELS,
  type PredefinedModelProvider,
} from '@/config/predefinedModels'
import { isLLMProvider, getLLMProviders } from '@/config/providers'
import { usePro } from '@/composables/usePro'
import { translate as t } from '@/core/utils/i18n'
import { createOnboardingPresetsSettings } from '@/config/defaultPresets'

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
 * Generate default keyboard shortcut for a preset index.
 * Ctrl+Alt combos avoid conflicts with Chrome tab shortcuts (Ctrl+N) and
 * GNOME/OS shortcuts that capture plain Alt+N.
 *
 * Examples:
 * - Preset 1 → Ctrl+Alt+T
 * - Preset 2 → Ctrl+Alt+2
 * - Preset 3 → Ctrl+Alt+3
 * - Preset 9 → Ctrl+Alt+9
 * - Preset 10+ → '' (empty — Pro user must assign a shortcut manually)
 */
function generateDefaultShortcut(index: number): string {
  if (index === 1) {
    return 'Alt+T'
  }
  // Single-digit range only (shortcut validator requires [A-Z0-9] single char)
  if (index >= 2 && index <= 9) {
    return `Ctrl+Alt+${index}`
  }
  // For Pro users with more than 9 presets, no auto-generated shortcut
  return ''
}

/**
 * Create a default preset with specified index and type.
 * For llm-prompt, globalProvider is used as the default LLM provider if it is LLM-compatible,
 * otherwise falls back to the first available LLM provider.
 */
function createDefaultPreset(
  index: number,
  type: 'translation' | 'transformation' | 'custom-transform' | 'llm-prompt' = 'translation',
  globalProvider?: string
): Preset {
  const basePreset = {
    id: generateUUID(),
    name: t('presetNameDefault', { params: { index } }),
    keyboardShortcut: generateDefaultShortcut(index),
    createdAt: Date.now(),
  }

  if (type === 'transformation') {
    return {
      ...basePreset,
      type: 'transformation',
      transformationStyle: 'strikethrough',
      exampleText: 'Example text',
    } as TransformationPreset
  } else if (type === 'custom-transform') {
    return {
      ...basePreset,
      type: 'custom-transform',
      customTransformId: '',
    } as CustomTransformPreset
  } else if (type === 'llm-prompt') {
    // Use the global provider if it is LLM-compatible, otherwise pick the first LLM provider
    const fallbackProvider = getLLMProviders()[0]?.value ?? 'gemini'
    const defaultLLMProvider =
      globalProvider && isLLMProvider(globalProvider) ? globalProvider : fallbackProvider
    return {
      ...basePreset,
      type: 'llm-prompt',
      prompt: '',
      llmProvider: defaultLLMProvider,
      // Use the default model for the resolved provider so the field is never blank.
      // 'custom' provider has no predefined models, so fall back to empty string.
      llmModel:
        defaultLLMProvider in PREDEFINED_MODELS
          ? getDefaultModel(defaultLLMProvider as PredefinedModelProvider)
          : '',
    } as LLMPromptPreset
  } else {
    return {
      ...basePreset,
      type: 'translation',
      sourceLang: 'auto',
      targetLang: 'en',
    } as TranslationPreset
  }
}

/**
 * Get default presets settings — delegates to the shared onboarding factory.
 * Used as an in-memory fallback before storage loads, and as a reset target on
 * invalid data. The authoritative first-run write happens in background.ts onInstalled.
 */
function getDefaultPresetsSettings(): PresetsSettings {
  return createOnboardingPresetsSettings()
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
 * Migrate preset to typed format (add type field if missing)
 */
function migratePresetToTyped(preset: Record<string, unknown>): Preset {
  // If preset already has type field, it's already migrated
  if (
    'type' in preset &&
    typeof preset.type === 'string' &&
    ['translation', 'transformation', 'custom-transform', 'llm-prompt'].includes(preset.type)
  ) {
    return preset as unknown as Preset
  }

  // Legacy preset without type → assume translation preset
  return {
    ...preset,
    type: 'translation',
  } as unknown as TranslationPreset
}

/**
 * Validate individual preset structure based on type
 */
function isValidPreset(preset: unknown): preset is Preset {
  if (typeof preset !== 'object' || preset === null) return false
  const p = preset as Record<string, unknown>

  // Base validation: all presets must have these fields
  const hasBaseFields =
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.keyboardShortcut === 'string' &&
    typeof p.createdAt === 'number'

  if (!hasBaseFields) return false

  // Type-specific validation
  if (p.type === 'translation') {
    // Translation presets require sourceLang and targetLang
    return typeof p.sourceLang === 'string' && typeof p.targetLang === 'string'
  } else if (p.type === 'transformation') {
    // Transformation presets require transformationStyle
    return typeof p.transformationStyle === 'string'
  } else if (p.type === 'custom-transform') {
    // Custom transform presets require customTransformId
    return typeof p.customTransformId === 'string'
  } else if (p.type === 'llm-prompt') {
    // LLM prompt presets require prompt, llmProvider, llmModel
    return (
      typeof p.prompt === 'string' &&
      typeof p.llmProvider === 'string' &&
      typeof p.llmModel === 'string'
    )
  }

  // Unknown type or missing type field
  return false
}

/**
 * Validate presets settings structure
 */
function isValidPresetsSettings(data: unknown): data is PresetsSettings {
  if (typeof data !== 'object' || data === null) {
    console.warn('[usePresetsSettings] Invalid data structure: not an object', { data })
    return false
  }

  const d = data as Record<string, unknown>
  const presets = Array.isArray(d.presets) ? (d.presets as unknown[]) : undefined

  const isValid =
    presets !== undefined &&
    presets.length > 0 &&
    presets.every((p: unknown) => isValidPreset(p)) &&
    typeof d.activePresetId === 'string' &&
    typeof d.provider === 'string'

  if (!isValid) {
    console.warn('[usePresetsSettings] Invalid data structure:', {
      hasData: true,
      hasPresets: d.presets !== undefined,
      isPresetsArray: Array.isArray(d.presets),
      presetsLength: presets?.length,
      presetsValid: presets?.every((p: unknown) => isValidPreset(p)),
      activePresetIdType: typeof d.activePresetId,
      providerType: typeof d.provider,
      data,
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

    // Case 1: New format exists
    if (result.presetsSettings) {
      // Migrate presets that don't have type field
      const migratedData = {
        ...result.presetsSettings,
        presets: result.presetsSettings.presets.map(migratePresetToTyped),
      }

      // Validate after migration
      if (isValidPresetsSettings(migratedData)) {
        presetsSettings.value = migratedData

        // Backfill pinnedPresetId if missing (migration for existing users)
        let needsSave = result.presetsSettings.presets.some(
          (p: unknown) => !(typeof p === 'object' && p !== null && 'type' in p)
        )
        if (
          presetsSettings.value.pinnedPresetId === undefined ||
          presetsSettings.value.pinnedPresetId === null
        ) {
          presetsSettings.value.pinnedPresetId = presetsSettings.value.presets[0].id
          needsSave = true
          console.log('[usePresetsSettings] Backfilled pinnedPresetId')
        }

        if (needsSave) {
          await chrome.storage.sync.set({ presetsSettings: presetsSettings.value })
          console.log('[usePresetsSettings] Migrated presets to typed format')
        } else {
          console.log('[usePresetsSettings] Loaded from storage')
        }
        return
      } else {
        console.warn('[usePresetsSettings] Invalid data after migration, resetting to defaults')
        presetsSettings.value = getDefaultPresetsSettings()
        await chrome.storage.sync.set({ presetsSettings: presetsSettings.value })
        return
      }
    }

    // Case 2: Migration from old settings format
    if (result.settings) {
      const oldSettings: TranslationSettings = result.settings

      const migratedPreset: TranslationPreset = {
        id: generateUUID(),
        name: t('presetNameDefault', { params: { index: 1 } }),
        type: 'translation',
        sourceLang: oldSettings.sourceLang,
        targetLang: oldSettings.targetLang,
        keyboardShortcut: oldSettings.keyboardShortcut,
        createdAt: Date.now(),
      }

      presetsSettings.value = {
        presets: [migratedPreset],
        activePresetId: migratedPreset.id,
        provider: oldSettings.provider,
        pinnedPresetId: migratedPreset.id, // Pin the first preset by default
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

/**
 * Composable to manage translation presets
 */
export function usePresetsSettings() {
  const { getMaxPresets, isUnlimited } = usePro()

  // Reactive max presets — updates automatically when pro status changes
  const maxPresets = computed(() => getMaxPresets())

  /**
   * Check if maximum presets limit is reached for the current user tier.
   */
  function canAddPreset(): boolean {
    const max = maxPresets.value
    if (!isFinite(max)) return true
    return presetsSettings.value.presets.length < max
  }

  /**
   * Find the next available preset number for auto-generated keyboard shortcut.
   * Searches linearly from preferredNumber upward.
   * Returns the number immediately when generateDefaultShortcut returns '' (index >= 10),
   * meaning the user must set a shortcut manually for that preset.
   */
  function findAvailablePresetNumber(preferredNumber: number): number {
    const existingNormalized = presetsSettings.value.presets.map((p) =>
      normalizeShortcut(p.keyboardShortcut)
    )

    // Search up to 100 positions ahead to find a free slot
    const searchLimit = preferredNumber + 100
    for (let num = preferredNumber; num <= searchLimit; num++) {
      const shortcut = generateDefaultShortcut(num)
      // No default shortcut for this index (Pro, index >= 10) — always available
      if (!shortcut) return num
      const candidate = normalizeShortcut(shortcut)
      if (!existingNormalized.includes(candidate)) {
        return num
      }
    }

    console.warn(
      '[findAvailablePresetNumber] No available slot found, using preferred:',
      preferredNumber
    )
    return preferredNumber
  }

  /**
   * Add a new preset with default values
   */
  function addPreset(
    type: 'translation' | 'transformation' | 'custom-transform' | 'llm-prompt' = 'translation'
  ): Preset | null {
    if (!canAddPreset()) {
      console.warn('[usePresetsSettings] Maximum presets limit reached')
      return null
    }

    const preferredIndex = presetsSettings.value.presets.length + 1
    const availableNumber = findAvailablePresetNumber(preferredIndex)
    // Pass the current global provider so llm-prompt presets default to it if LLM-compatible
    const newPreset = createDefaultPreset(availableNumber, type, presetsSettings.value.provider)

    presetsSettings.value.presets.push(newPreset)
    presetsSettings.value.activePresetId = newPreset.id

    console.log('[usePresetsSettings] Added new preset:', newPreset)
    return newPreset
  }

  /**
   * Update an existing preset
   */
  function updatePreset(updatedPreset: Preset): boolean {
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

    // If deleted preset was pinned, transfer pin to the first remaining preset
    if (presetsSettings.value.pinnedPresetId === id) {
      presetsSettings.value.pinnedPresetId = presetsSettings.value.presets[0].id
      console.log(
        '[usePresetsSettings] Pinned preset deleted, transferred pin to:',
        presetsSettings.value.pinnedPresetId
      )
    }

    console.log('[usePresetsSettings] Deleted preset:', id)
    return true
  }

  /**
   * Get a preset by ID
   */
  function getPresetById(id: string): Preset | undefined {
    return presetsSettings.value.presets.find((p) => p.id === id)
  }

  /**
   * Get the active preset
   * Returns the first preset if activePresetId is null or doesn't exist
   */
  function getActivePreset(): Preset | undefined {
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
   * Set the pinned preset (used for right-click context menu)
   */
  function setPinnedPreset(id: string): boolean {
    const preset = getPresetById(id)

    if (!preset) {
      console.error('[usePresetsSettings] Preset not found for pinning:', id)
      return false
    }

    presetsSettings.value.pinnedPresetId = id
    console.log('[usePresetsSettings] Pinned preset set to:', id)
    return true
  }

  /**
   * Get the pinned preset (fallback to first preset if pinned ID is invalid)
   */
  function getPinnedPreset(): Preset | undefined {
    const pinnedId = presetsSettings.value.pinnedPresetId

    if (pinnedId) {
      const preset = getPresetById(pinnedId)
      if (preset) return preset
    }

    // Fallback to first preset
    return presetsSettings.value.presets[0]
  }

  /**
   * Validate shortcut uniqueness across all presets
   */
  function validateShortcutUniqueness(
    shortcut: string,
    currentPresetId: string
  ): { valid: boolean; error?: string; duplicatePreset?: Preset } {
    // Use normalizeShortcut to catch all equivalent formats (e.g. Ctrl+Alt+1 vs Alt+Ctrl+1)
    const normalized = normalizeShortcut(shortcut)

    const duplicate = presetsSettings.value.presets.find(
      (p) => p.id !== currentPresetId && normalizeShortcut(p.keyboardShortcut) === normalized
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
    setPinnedPreset,
    getPinnedPreset,
    validateShortcutUniqueness,
    generateDefaultShortcut,
    canAddPreset,
    maxPresets,
    isUnlimited,
  }
}
