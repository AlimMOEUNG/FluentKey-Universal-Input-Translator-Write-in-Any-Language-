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
 * Base preset interface with common fields
 */
export interface BasePreset {
  id: string
  name: string
  keyboardShortcut: string
  createdAt: number
}

/**
 * Translation preset (triplet: sourceLang + targetLang + keyboardShortcut)
 */
export interface TranslationPreset extends BasePreset {
  type: 'translation'
  sourceLang: string
  targetLang: string
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
 * Union type for all preset types
 */
export type Preset = TranslationPreset | TransformationPreset

/**
 * Presets settings structure
 */
export interface PresetsSettings {
  presets: Preset[]
  activePresetId: string | null
  provider: TranslationProvider
}
