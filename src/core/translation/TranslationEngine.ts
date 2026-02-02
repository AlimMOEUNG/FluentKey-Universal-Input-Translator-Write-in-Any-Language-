/**
 * TranslationEngine - Factory for translation providers
 * Manages provider instantiation and translation coordination
 */

import { SettingsManager } from '../storage/SettingsManager'
import {
  BaseTranslationProvider,
  ChromeBuiltInProvider,
  DeepLProvider,
  GeminiProvider,
  GoogleTranslateProvider,
  OpenAICompatibleProvider,
  OpenAIConfig,
  getDefaultEndpoint,
} from './providers'
import { getEffectiveModel } from '@/config/predefinedModels'

export class TranslationEngine {
  private currentProvider: BaseTranslationProvider | null = null
  private currentProviderType: string | null = null

  constructor(private settings: SettingsManager) {}

  /**
   * Initialize translation engine
   * Creates the appropriate provider based on settings
   */
  async initialize(): Promise<void> {
    await this.reinitializeProvider()
  }

  /**
   * Reinitialize provider when settings change
   */
  async reinitializeProvider(): Promise<void> {
    const providerType = this.settings.get('provider')

    // If provider hasn't changed, don't reinitialize
    if (providerType === this.currentProviderType && this.currentProvider) {
      return
    }

    // Destroy old provider
    if (this.currentProvider) {
      this.currentProvider.destroy()
      this.currentProvider = null
    }

    // Create new provider
    this.currentProvider = await this.createProvider(providerType)
    this.currentProviderType = providerType

    // Initialize provider
    if (this.currentProvider) {
      await this.currentProvider.initialize()
      console.log(`[TranslationEngine] Initialized provider: ${this.currentProvider.name}`)
    }
  }

  /**
   * Create provider instance based on type
   */
  private async createProvider(providerType: string): Promise<BaseTranslationProvider> {
    switch (providerType) {
      case 'builtin':
        return new ChromeBuiltInProvider()

      case 'google':
        return new GoogleTranslateProvider()

      case 'deepl': {
        const { providerKeys } = await chrome.storage.local.get('providerKeys')
        const apiKey = providerKeys?.deeplApiKey
        if (!apiKey) {
          throw new Error(
            'DeepL API key is required. Please configure it in the extension settings.'
          )
        }
        return new DeepLProvider(apiKey)
      }

      case 'gemini': {
        const { providerKeys } = await chrome.storage.local.get('providerKeys')
        const geminiConfig = providerKeys?.geminiConfig
        if (!geminiConfig?.apiKey) {
          throw new Error(
            'Gemini API key is required. Please configure it in the extension settings.'
          )
        }
        const effectiveModel = getEffectiveModel(
          geminiConfig.model || 'gemini-1.5-flash',
          geminiConfig.customModel
        )
        return new GeminiProvider(geminiConfig.apiKey, effectiveModel)
      }

      case 'chatgpt':
      case 'groq':
      case 'ollama':
      case 'openrouter':
      case 'custom': {
        const { providerKeys } = await chrome.storage.local.get('providerKeys')
        const configKey = `${providerType}Config`
        const config = providerKeys?.[configKey]

        if (!config) {
          throw new Error(
            `${providerType} configuration is required. Please configure it in the extension settings.`
          )
        }

        const effectiveModel = getEffectiveModel(config.model, config.customModel)

        const openaiConfig: OpenAIConfig = {
          providerType: providerType as any,
          baseUrl: config.baseUrl || getDefaultEndpoint(providerType as any),
          apiKey: config.apiKey,
          model: effectiveModel,
        }

        return new OpenAICompatibleProvider(openaiConfig)
      }

      default:
        throw new Error(`Unknown provider: ${providerType}`)
    }
  }

  /**
   * Translate text using the configured provider
   * @param text Text to translate
   * @param sourceLang Optional source language (overrides settings)
   * @param targetLang Optional target language (overrides settings)
   */
  async translateText(text: string, sourceLang?: string, targetLang?: string): Promise<string> {
    // Ensure provider is initialized
    if (!this.currentProvider) {
      await this.reinitializeProvider()
    }

    if (!this.currentProvider) {
      throw new Error('No translation provider available')
    }

    // Use provided languages or fall back to settings
    const source = sourceLang !== undefined ? sourceLang : this.settings.get('sourceLang')
    const target = targetLang !== undefined ? targetLang : this.settings.get('targetLang')

    console.log(
      `[TranslationEngine] Translating with ${this.currentProvider.name}: "${text.substring(0, 50)}..." (${source} → ${target})`
    )

    try {
      const translated = await this.currentProvider.translateText(text, {
        targetLanguage: target,
        sourceLanguage: source === 'auto' ? undefined : source,
      })

      console.log(`[TranslationEngine] Translation successful`)
      return translated
    } catch (error) {
      console.error('[TranslationEngine] Translation failed:', error)
      throw error
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.currentProvider) {
      this.currentProvider.destroy()
      this.currentProvider = null
    }
    this.currentProviderType = null
  }
}
