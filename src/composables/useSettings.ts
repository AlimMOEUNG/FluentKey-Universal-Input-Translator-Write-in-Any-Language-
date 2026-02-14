/**
 * Composable to manage translation settings
 * Uses Chrome storage sync to persist settings across devices
 */

import { useStorageState } from './useStorageState'
import { PROVIDER_BASE_URLS } from '@/config/providers'

export type TranslationProvider =
  | 'google'
  | 'builtin'
  | 'deepl'
  | 'gemini'
  | 'chatgpt'
  | 'groq'
  | 'ollama'
  | 'openrouter'
  | 'custom'

export interface TranslationSettings {
  sourceLang: string
  targetLang: string
  provider: TranslationProvider
  keyboardShortcut: string
}

export interface ProviderConfigs {
  deepl: {
    apiKey: string
  }
  gemini: {
    apiKey: string
    model: string // Selected model from dropdown or 'custom'
    customModel?: string // Custom model name when model === 'custom'
  }
  chatgpt: {
    apiKey: string
    baseUrl: string
    model: string // Selected model from dropdown or 'custom'
    customModel?: string // Custom model name when model === 'custom'
  }
  groq: {
    apiKey: string
    baseUrl: string
    model: string // Selected model from dropdown or 'custom'
    customModel?: string // Custom model name when model === 'custom'
  }
  ollama: {
    baseUrl: string
    model: string // Selected model from dropdown or 'custom'
    customModel?: string // Custom model name when model === 'custom'
  }
  openrouter: {
    apiKey: string
    baseUrl: string
    model: string // Selected model from dropdown or 'custom'
    customModel?: string // Custom model name when model === 'custom'
  }
  custom: {
    baseUrl: string
    apiKey: string
    model: string
  }
}

const DEFAULT_SETTINGS: TranslationSettings = {
  sourceLang: 'auto',
  targetLang: 'en',
  provider: 'google',
  keyboardShortcut: 'Alt+T',
}

const DEFAULT_PROVIDER_CONFIGS: ProviderConfigs = {
  deepl: {
    apiKey: '',
  },
  gemini: {
    apiKey: '',
    model: 'gemini-2.0-flash',
  },
  chatgpt: {
    apiKey: '',
    baseUrl: PROVIDER_BASE_URLS.chatgpt,
    model: 'gpt-4o-mini',
  },
  groq: {
    apiKey: '',
    baseUrl: PROVIDER_BASE_URLS.groq,
    model: 'llama-3.3-70b-versatile',
  },
  ollama: {
    baseUrl: PROVIDER_BASE_URLS.ollama,
    model: 'llama3.2',
  },
  openrouter: {
    apiKey: '',
    baseUrl: PROVIDER_BASE_URLS.openrouter,
    model: 'meta-llama/llama-3.3-70b-instruct',
  },
  custom: {
    baseUrl: '',
    apiKey: '',
    model: '',
  },
}

/**
 * Composable to manage translation settings
 * All settings are automatically synced with Chrome storage
 *
 * @example
 * const { settings, providerConfigs } = useSettings()
 * settings.value.provider = 'google'  // Automatically saved
 * providerConfigs.value.deepl.apiKey = 'xxx'  // Automatically saved
 */
export function useSettings() {
  // Load translation settings from Chrome storage sync
  const { value: settings } = useStorageState<TranslationSettings>('settings', DEFAULT_SETTINGS, {
    storageArea: 'sync',
  })

  // Load provider configs from Chrome storage local (API keys)
  const { value: providerConfigs, isLoading: providerConfigsLoading } =
    useStorageState<ProviderConfigs>('providerKeys', DEFAULT_PROVIDER_CONFIGS, {
      storageArea: 'local', // API keys stored locally for security
    })

  return {
    settings,
    providerConfigs,
    providerConfigsLoading,
  }
}
