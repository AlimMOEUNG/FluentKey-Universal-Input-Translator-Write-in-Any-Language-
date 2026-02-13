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
 * LLM providers that support chat-completion API (subset of TranslationProvider)
 */
export type LLMProvider = 'gemini' | 'chatgpt' | 'groq' | 'ollama' | 'openrouter' | 'custom'

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
 * Base preset interface with common fields
 */
export interface BasePreset {
  id: string
  name: string
  keyboardShortcut: string
  createdAt: number
}

/**
 * Per-preset provider configuration (for custom provider in presets)
 * Generic structure that works for any provider - NOT memorized between provider changes
 */
export interface PresetProviderConfig {
  apiKey?: string // API key for the current provider (if required)
  baseUrl?: string // Base URL for the current provider (if required)
  model?: string // Selected model from dropdown or 'custom' (for LLM providers)
  customModel?: string // Custom model name when model === 'custom'
}

/**
 * Translation preset (triplet: sourceLang + targetLang + keyboardShortcut)
 * Can optionally use a custom provider instead of the global one
 */
export interface TranslationPreset extends BasePreset {
  type: 'translation'
  sourceLang: string
  targetLang: string
  useCustomProvider?: boolean // If true, use customProvider instead of global
  customProvider?: TranslationProvider // Provider to use when useCustomProvider is true
  customProviderConfig?: PresetProviderConfig // Custom provider configuration (when useCustomProvider is true)
}

/**
 * Transformation styles for text effects
 */
export type TransformationStyle =
  | 'strikethrough' // s̶t̶r̶i̶k̶e̶t̶h̶r̶o̶u̶g̶h̶
  | 'upside-down' // ʇxǝʇ pǝddᴉlɟ
  | 'mirror' // reversed text (RTL)
  | 'bold' // 𝗯𝗼𝗹𝗱
  | 'italic' // 𝘪𝘵𝘢𝘭𝘪𝘤
  | 'bold-italic' // 𝙗𝙤𝙡𝙙-𝙞𝙩𝙖𝙡𝙞𝙘
  | 'script' // 𝓼𝓬𝓻𝓲𝓹𝓽 (cursive)
  | 'circled' // ⓒⓘⓡⓒⓛⓔⓓ
  | 'squared' // 🅂🅀🅄🅰🅁🅴🅳
  | 'monospace' // 𝚖𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎
  | 'double-struck' // 𝕕𝕠𝕦𝕓𝕝𝕖-𝕤𝕥𝕣𝕦𝕔𝕜
  | 'fullwidth' // ｆｕｌｌｗｉｄｔｈ
  | 'smallcaps' // sᴍᴀʟʟᴄᴀᴘs
  | 'morse' // .... . .-.. .-.. ---
  | 'zalgo' // Z̶̬̠̮̃̌̈́ȃ̶̡̛̰̝̈l̵̛̮̐̑g̷̶̛̺̻̞̓̃o̶̟̓̈́̚
  | 'zalgo-lite' // Z̃ȃl̐g̓o̚
  | 'leet' // H3||0
  | 'rot13' // Uryyb
  | 'braille' // ⠓⠑⠇⠇⠕
  | 'drunk' // hOw DaRe YoU

/**
 * Transformation preset for text effects
 */
export interface TransformationPreset extends BasePreset {
  type: 'transformation'
  transformationStyle: TransformationStyle
  exampleText?: string // Optional customizable preview text
}

/**
 * Custom char-to-char transformation stored in chrome.storage.sync
 */
export interface CustomTransformation {
  id: string
  name: string
  charMap: Record<string, string>
  baseStyle?: TransformationStyle // built-in style used for pre-population, if any
  createdAt: number
  updatedAt: number
}

/**
 * Index of custom transformation IDs stored under a single storage key
 */
export interface CustomTransformIndex {
  ids: string[]
}

/**
 * Preset referencing a user-created custom char-map transformation
 */
export interface CustomTransformPreset extends BasePreset {
  type: 'custom-transform'
  customTransformId: string // references CustomTransformation.id
}

/**
 * Preset that sends a prompt template to a per-preset LLM provider
 */
export interface LLMPromptPreset extends BasePreset {
  type: 'llm-prompt'
  prompt: string // template string with {{input}} placeholder
  llmProvider: LLMProvider
  llmModel: string // resolved model name (never 'custom')
}

/**
 * Union type for all preset types
 */
export type Preset =
  | TranslationPreset
  | TransformationPreset
  | CustomTransformPreset
  | LLMPromptPreset

/**
 * Modifier key used for word-by-word selection (Alt+Arrow by default)
 */
export type SelectionModifier = 'Alt' | 'Ctrl' | 'Shift' | 'Meta'

/**
 * Presets settings structure
 */
export interface PresetsSettings {
  presets: Preset[]
  activePresetId: string | null
  provider: TranslationProvider
  selectionModifier?: SelectionModifier
}
