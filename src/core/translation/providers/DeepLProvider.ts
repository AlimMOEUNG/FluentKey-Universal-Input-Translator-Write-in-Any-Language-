/**
 * DeepLProvider - DeepL API translator
 *
 * Uses DeepL API for high-quality translations
 * - Requires API key (free or pro)
 * - Auto-detects free vs pro endpoint
 * - High translation quality
 */

import { BaseTranslationProvider, TranslationOptions } from './BaseTranslationProvider'

export class DeepLProvider extends BaseTranslationProvider {
  readonly name = 'DeepL'
  readonly requiresApiKey = true

  private apiKey: string

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
  }

  /**
   * Translate text using DeepL API (via background script for CORS bypass)
   */
  async translateText(text: string, options: TranslationOptions): Promise<string> {
    if (!this.isValidText(text)) {
      return text
    }

    if (!this.apiKey) {
      this.handleError(new Error('API key is required'), 'Translation failed')
    }

    const { targetLanguage, sourceLanguage } = options

    try {
      // Send translation request to background script (CORS bypass)
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_DEEPL',
        text,
        targetLang: targetLanguage,
        apiKey: this.apiKey,
        sourceLang: sourceLanguage === 'auto' || !sourceLanguage ? undefined : sourceLanguage,
      })

      if (!response.success) {
        throw new Error(response.error || 'Translation failed')
      }

      return response.data.translation
    } catch (error) {
      this.handleError(error, 'Translation failed')
    }
  }

  /**
   * Validate DeepL API key
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return { valid: false, error: 'API key is required' }
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'VALIDATE_DEEPL_KEY',
        apiKey: this.apiKey,
      })

      if (!response.success) {
        return { valid: false, error: response.error || 'Invalid API key' }
      }

      return { valid: true }
    } catch {
      return { valid: false, error: 'Validation failed' }
    }
  }
}
