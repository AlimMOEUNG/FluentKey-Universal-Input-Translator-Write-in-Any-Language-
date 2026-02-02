/**
 * Common types for the extension
 */

export interface AppSettings {
  theme: 'auto' | 'light' | 'dark'
  locale: string
}

/**
 * Translation provider types
 */
export type TranslationProvider =
  | 'builtin'
  | 'google'
  | 'deepl'
  | 'gemini'
  | 'chatgpt'
  | 'groq'
  | 'ollama'
  | 'openrouter'
  | 'custom'

/**
 * Translation settings
 */
export interface TranslationSettings {
  sourceLang: string
  targetLang: string
  provider: TranslationProvider
  keyboardShortcut: string
}

/**
 * Provider API keys and configurations
 */
export interface ProviderKeys {
  deeplApiKey?: string
  geminiConfig?: {
    apiKey: string
    model: string // Selected model from dropdown or 'custom'
    customModel?: string // Custom model name when model === 'custom'
  }
  chatgptConfig?: {
    baseUrl: string
    apiKey: string
    model: string // Selected model from dropdown or 'custom'
    customModel?: string // Custom model name when model === 'custom'
  }
  groqConfig?: {
    baseUrl: string
    apiKey: string
    model: string // Selected model from dropdown or 'custom'
    customModel?: string // Custom model name when model === 'custom'
  }
  ollamaConfig?: {
    baseUrl: string
    model: string // Selected model from dropdown or 'custom'
    customModel?: string // Custom model name when model === 'custom'
  }
  openrouterConfig?: {
    baseUrl: string
    apiKey: string
    model: string // Selected model from dropdown or 'custom'
    customModel?: string // Custom model name when model === 'custom'
  }
  customConfig?: {
    baseUrl: string
    apiKey?: string
    model: string
  }
}

/**
 * Translation preset (triplet: sourceLang + targetLang + keyboardShortcut)
 */
export interface TranslationPreset {
  id: string
  name: string
  sourceLang: string
  targetLang: string
  keyboardShortcut: string
  createdAt: number
}

/**
 * Presets settings structure
 */
export interface PresetsSettings {
  presets: TranslationPreset[]
  activePresetId: string | null
  provider: TranslationProvider
}
