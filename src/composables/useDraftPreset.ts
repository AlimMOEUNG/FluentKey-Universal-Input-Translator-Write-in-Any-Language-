import type { Preset, PresetProviderConfig } from '@/types/common'

// Key used in chrome.storage.local for the global draft slot
const DRAFT_STORAGE_KEY = 'presetDraft'

export interface DraftPresetState {
  // Which preset is being drafted
  presetId: string
  // Full working copy of the preset
  localPreset: Preset
  // Custom provider config (translation type)
  presetConfig: PresetProviderConfig
  // Dropdown value for LLM model, can be 'custom'
  llmModelSelection: string
  // Free-text model name when selection='custom'
  llmCustomModelInput: string
  // Credential drafts for llm-prompt mode (not yet flushed to providerConfigs)
  llmApiKeyDraft?: string
  llmBaseUrlDraft?: string
  // Preview text (transformation type)
  customExampleText: string
  // Unix timestamp when draft was saved
  savedAt: number
}

export function useDraftPreset() {
  /**
   * Load the current draft from chrome.storage.local.
   * Returns null on any error or if no draft exists.
   */
  async function loadDraft(): Promise<DraftPresetState | null> {
    try {
      const result = await chrome.storage.local.get(DRAFT_STORAGE_KEY)
      const draft = result[DRAFT_STORAGE_KEY]
      if (!draft) return null
      return draft as DraftPresetState
    } catch (e) {
      console.error('[useDraftPreset] Failed to load draft:', e)
      return null
    }
  }

  /**
   * Persist the current draft state to chrome.storage.local.
   * Silently swallows errors (non-critical).
   */
  async function saveDraft(state: DraftPresetState): Promise<void> {
    try {
      await chrome.storage.local.set({ [DRAFT_STORAGE_KEY]: state })
    } catch (e) {
      console.error('[useDraftPreset] Failed to save draft:', e)
    }
  }

  /**
   * Remove the draft from chrome.storage.local.
   * Silently swallows errors.
   */
  async function clearDraft(): Promise<void> {
    try {
      await chrome.storage.local.remove(DRAFT_STORAGE_KEY)
    } catch (e) {
      console.error('[useDraftPreset] Failed to clear draft:', e)
    }
  }

  return { loadDraft, saveDraft, clearDraft }
}
