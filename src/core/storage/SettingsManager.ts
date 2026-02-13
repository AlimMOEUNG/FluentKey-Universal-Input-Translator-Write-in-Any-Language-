/**
 * SettingsManager - Manages extension settings from chrome.storage
 * Provides simple get/set interface for settings
 * Now supports multiple presets with migration from old format
 */

import type {
  Preset,
  TranslationPreset,
  PresetsSettings,
  TranslationProvider,
  SelectionModifier,
} from '@/types/common'

// Keep these in sync with src/composables/usePro.ts
const FREE_MAX_PRESETS = 5
const BETA_CUTOFF_DATE = new Date('2026-03-15').getTime()

export interface Settings {
  sourceLang: string // ISO 639-1 code or 'auto'
  targetLang: string // ISO 639-1 code
  provider: 'builtin' | 'deepl' | 'gemini'
  keyboardShortcut: string // e.g., 'Ctrl+Alt+T'
}

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

export class SettingsManager {
  // Pro/beta status — loaded from chrome.storage.sync alongside presets
  private proStatus: string = 'free'

  // Legacy settings (for backward compatibility during migration)
  private settings: Settings = {
    sourceLang: 'auto',
    targetLang: 'en',
    provider: 'builtin',
    keyboardShortcut: 'Ctrl+Alt+T',
  }

  // New presets-based settings
  private presetsSettings: PresetsSettings = (() => {
    const defaultPresetId = generateUUID()
    return {
      presets: [
        {
          id: defaultPresetId,
          name: 'Preset 1',
          type: 'translation',
          sourceLang: 'auto',
          targetLang: 'en',
          keyboardShortcut: 'Ctrl+Alt+T', // Intuitive default for translation
          createdAt: Date.now(),
        },
      ],
      activePresetId: null,
      provider: 'google',
      pinnedPresetId: defaultPresetId, // First preset is pinned by default
    } as PresetsSettings
  })()

  /**
   * Load settings from chrome.storage.sync
   * Handles migration from old format to new presets format
   */
  async load(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['settings', 'presetsSettings', 'proStatus'])

      // Load pro status for locked-preset filtering in the content script
      if (result.proStatus && ['free', 'beta_unlocked', 'pro_paid'].includes(result.proStatus)) {
        this.proStatus = result.proStatus
      }

      // If new format exists, use it
      if (result.presetsSettings) {
        this.presetsSettings = result.presetsSettings
        if (!this.presetsSettings.activePresetId && this.presetsSettings.presets.length > 0) {
          this.presetsSettings.activePresetId = this.presetsSettings.presets[0].id
        }
        console.log('[SettingsManager] Presets settings loaded:', this.presetsSettings)
      }
      // Migrate from old format
      else if (result.settings) {
        console.log('[SettingsManager] Migrating old settings to presets format...')
        this.settings = { ...this.settings, ...result.settings }

        // Create first preset from old settings
        const migratedPreset: TranslationPreset = {
          id: generateUUID(),
          name: 'Preset 1',
          type: 'translation',
          sourceLang: this.settings.sourceLang,
          targetLang: this.settings.targetLang,
          keyboardShortcut: this.settings.keyboardShortcut,
          createdAt: Date.now(),
        }

        this.presetsSettings = {
          presets: [migratedPreset],
          activePresetId: migratedPreset.id,
          provider: this.settings.provider as TranslationProvider,
          pinnedPresetId: migratedPreset.id, // Pin the first preset by default
        }

        // Save migrated settings
        await chrome.storage.sync.set({ presetsSettings: this.presetsSettings })
        await chrome.storage.sync.remove('settings')
        console.log('[SettingsManager] Migration complete')
      }
      // No existing settings
      else {
        this.presetsSettings.activePresetId = this.presetsSettings.presets[0].id
        console.log('[SettingsManager] No settings found, using defaults')
      }
    } catch (error) {
      console.error('[SettingsManager] Failed to load settings:', error)
    }
  }

  /**
   * Returns true when the current user has unlimited preset access.
   * Mirrors the logic in src/composables/usePro.ts — keep in sync.
   */
  private isUnlimitedAccess(): boolean {
    return (
      (this.proStatus === 'beta_unlocked' && Date.now() < BETA_CUTOFF_DATE) ||
      this.proStatus === 'pro_paid'
    )
  }

  /**
   * Returns true if the preset at the given index should be considered locked.
   * Locked presets are kept in storage but their keyboard shortcuts must not fire.
   */
  isPresetLocked(index: number): boolean {
    return !this.isUnlimitedAccess() && index >= FREE_MAX_PRESETS
  }

  /**
   * Get a setting value (legacy method for backward compatibility)
   * Uses the first preset's settings (only works if first preset is a translation preset)
   */
  get<K extends keyof Settings>(key: K): Settings[K] {
    if (key === 'provider') {
      return this.presetsSettings.provider as Settings[K]
    }
    const firstPreset = this.presetsSettings.presets[0]
    if (firstPreset.type !== 'translation') {
      // Fallback to defaults if first preset is not a translation preset
      const defaults: Settings = {
        sourceLang: 'auto',
        targetLang: 'en',
        provider: this.presetsSettings.provider as 'builtin' | 'deepl' | 'gemini',
        keyboardShortcut: 'Ctrl+Alt+T',
      }
      return defaults[key]
    }
    return firstPreset[key as keyof TranslationPreset] as Settings[K]
  }

  /**
   * Get all settings (legacy method)
   * Returns defaults if first preset is not a translation preset
   */
  getAll(): Settings {
    const firstPreset = this.presetsSettings.presets[0]
    if (firstPreset.type !== 'translation') {
      return {
        sourceLang: 'auto',
        targetLang: 'en',
        provider: this.presetsSettings.provider as 'builtin' | 'deepl' | 'gemini',
        keyboardShortcut: firstPreset.keyboardShortcut,
      }
    }
    return {
      sourceLang: firstPreset.sourceLang,
      targetLang: firstPreset.targetLang,
      provider: this.presetsSettings.provider as 'builtin' | 'deepl' | 'gemini',
      keyboardShortcut: firstPreset.keyboardShortcut,
    }
  }

  /**
   * Get all presets
   */
  getPresets(): Preset[] {
    return this.presetsSettings.presets
  }

  /**
   * Get a preset by ID
   */
  getPresetById(id: string): Preset | undefined {
    return this.presetsSettings.presets.find((p) => p.id === id)
  }

  /**
   * Get the global provider
   */
  getProvider(): TranslationProvider {
    return this.presetsSettings.provider
  }

  /**
   * Get all presets settings
   */
  getPresetsSettings(): PresetsSettings {
    return this.presetsSettings
  }

  /**
   * Get the configured selection modifier key (defaults to 'Alt')
   */
  getSelectionModifier(): SelectionModifier {
    return this.presetsSettings.selectionModifier ?? 'Alt'
  }

  /**
   * Get the pinned preset ID (used for right-click context menu)
   */
  getPinnedPresetId(): string | null {
    return this.presetsSettings.pinnedPresetId ?? null
  }

  /**
   * Get the pinned preset object; falls back to first preset if pinnedPresetId is missing or stale
   */
  getPinnedPreset(): Preset | undefined {
    const pinnedId = this.presetsSettings.pinnedPresetId
    if (pinnedId) {
      const preset = this.presetsSettings.presets.find((p) => p.id === pinnedId)
      if (preset) return preset
    }
    // Fallback to first preset
    return this.presetsSettings.presets[0]
  }

  /**
   * Set a setting value (legacy method)
   * Only works if first preset is a translation preset
   */
  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    if (key === 'provider') {
      this.presetsSettings.provider = value as TranslationProvider
    } else {
      // Update first preset only if it's a translation preset
      const firstPreset = this.presetsSettings.presets[0]
      if (firstPreset.type === 'translation') {
        ;(firstPreset[key as keyof TranslationPreset] as any) = value
      }
    }
  }

  /**
   * Update settings and save to storage (legacy method)
   */
  async save(): Promise<void> {
    try {
      await chrome.storage.sync.set({ presetsSettings: this.presetsSettings })
      console.log('[SettingsManager] Settings saved:', this.presetsSettings)
    } catch (error) {
      console.error('[SettingsManager] Failed to save settings:', error)
    }
  }
}
