/**
 * GeminiProvider - Google Gemini API translator
 *
 * Uses Google AI Studio API (Gemini models)
 * - Requires API key
 * - High quality LLM-based translation
 * - Configurable model selection
 */

import { BaseTranslationProvider, TranslationOptions } from './BaseTranslationProvider'

export class GeminiProvider extends BaseTranslationProvider {
  readonly name = 'Google Gemini'
  readonly requiresApiKey = true

  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    super()
    this.apiKey = apiKey
    this.model = model
  }

  /**
   * Translate text using Gemini API (via background script for CORS bypass)
   */
  async translateText(text: string, options: TranslationOptions): Promise<string> {
    if (!this.isValidText(text)) {
      return text
    }

    if (!this.apiKey) {
      this.handleError(new Error('API key is required'), 'Translation failed')
    }

    const { targetLanguage } = options

    try {
      // Send translation request to background script (CORS bypass)
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_GEMINI',
        text,
        targetLang: targetLanguage,
        apiKey: this.apiKey,
        model: this.model,
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
   * Validate Gemini API key
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return { valid: false, error: 'API key is required' }
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'VALIDATE_GEMINI_KEY',
        apiKey: this.apiKey,
        model: this.model,
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
