/**
 * Changelog data for the Power Input extension.
 * Used by the What's New page to display version history.
 * Uses i18n keys so text is translatable via the automated pipeline.
 */

import type { TranslationKey } from '../core/utils/i18n'

export interface ChangelogEntry {
  version: string
  date: string // YYYY-MM-DD
  changes: {
    type: 'feature' | 'improvement' | 'fix'
    key: TranslationKey // i18n key
  }[]
}

export interface FeatureSummary {
  categoryKey: TranslationKey // i18n key for category title
  features: {
    key: TranslationKey // i18n key for feature description
    version: string
  }[]
}

/**
 * Complete version history (newest first)
 */
export const changelog: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2026-02-14',
    changes: [
      { type: 'feature', key: 'changelogV100TranslationPresets' },
      { type: 'feature', key: 'changelogV100Providers' },
      { type: 'feature', key: 'changelogV100LlmPrompt' },
      { type: 'feature', key: 'changelogV100Unicode' },
      { type: 'feature', key: 'changelogV100ContextMenu' },
      { type: 'feature', key: 'changelogV100Shortcuts' },
      { type: 'feature', key: 'changelogV100WordSelection' },
      { type: 'feature', key: 'changelogV100CustomTransform' },
      { type: 'feature', key: 'changelogV100DarkMode' },
      { type: 'feature', key: 'changelogV100I18n' },
    ],
  },
]

/**
 * Features organized by category for the "Features" view.
 * Uses i18n keys — category and feature labels are translatable.
 */
export const featureSummary: FeatureSummary[] = [
  {
    categoryKey: 'featureCategoryTranslation',
    features: [
      { key: 'featureDeepL', version: '1.0.0' },
      { key: 'featureGemini', version: '1.0.0' },
      { key: 'featureOpenAI', version: '1.0.0' },
      { key: 'featureBuiltinAI', version: '1.0.0' },
      { key: 'featureCustomProvider', version: '1.0.0' },
      { key: 'featureAutoDetect', version: '1.0.0' },
    ],
  },
  {
    categoryKey: 'featureCategoryPresets',
    features: [
      { key: 'featureMultiPreset', version: '1.0.0' },
      { key: 'featurePinContextMenu', version: '1.0.0' },
      { key: 'featureKeyboardShortcutPerPreset', version: '1.0.0' },
      { key: 'featureWordSelectionModifier', version: '1.0.0' },
      { key: 'featureDraftAutoSave', version: '1.0.0' },
    ],
  },
  {
    categoryKey: 'featureCategoryTransformations',
    features: [
      { key: 'featureLlmPromptMode', version: '1.0.0' },
      { key: 'featureUnicodeEffects', version: '1.0.0' },
      { key: 'featureCustomMappings', version: '1.0.0' },
    ],
  },
  {
    categoryKey: 'featureCategoryInterface',
    features: [
      { key: 'featureDarkMode', version: '1.0.0' },
      { key: 'featureI18n', version: '1.0.0' },
      { key: 'featureInlinePreview', version: '1.0.0' },
      { key: 'featurePendingIndicator', version: '1.0.0' },
    ],
  },
]

/**
 * Returns the current extension version from the manifest.
 * Falls back to a hard-coded string if the manifest is unavailable.
 */
export function getCurrentVersion(): string {
  try {
    return chrome.runtime.getManifest().version
  } catch {
    return '1.0.0'
  }
}
