/**
 * GeminiProvider - Google Gemini API translator
 *
 * Uses Google AI Studio API (Gemini models)
 * - Requires API key
 * - High quality LLM-based translation
 * - Configurable model selection
 */

import { BaseTranslationProvider, TranslationOptions } from './BaseTranslationProvider'

// Gemini REST API endpoint
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

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
   * Get the full Gemini API endpoint URL
   */
  private getEndpointUrl(): string {
    return `${GEMINI_API_BASE}/${this.model}:generateContent?key=${this.apiKey}`
  }

  /**
   * Make a Gemini API request via PROXY_FETCH
   */
  private async makeGeminiRequest(
    prompt: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    // Send request via background script (CORS bypass)
    return await chrome.runtime.sendMessage({
      type: 'PROXY_FETCH',
      url: this.getEndpointUrl(),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    })
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
      // Build prompt for translation
      const prompt = `Translate the following text to ${targetLanguage}. If the text is already in ${targetLanguage}, return it unchanged. Return ONLY the translation or original text without any explanations, notes, or additional text.\n\nText: "${text}"`

      const response = await this.makeGeminiRequest(prompt)

      if (!response.success) {
        // Parse specific error codes
        let errorMessage = response.error || 'Translation failed'

        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = 'Gemini API quota exceeded. Please check your credits at console.cloud.google.com'
        } else if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('API_KEY_INVALID')) {
          errorMessage = 'Gemini API key is invalid. Please check your settings.'
        }

        throw new Error(errorMessage)
      }

      // Extract translation from response
      const translation = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

      if (!translation) {
        throw new Error('Empty response from Gemini API')
      }

      console.log('[Gemini] Translation successful')
      return translation
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
      const response = await this.makeGeminiRequest('Test')

      if (response.success) {
        return { valid: true }
      } else {
        let errorMessage = response.error || 'Invalid API key'

        if (errorMessage.includes('API key') || errorMessage.includes('401')) {
          errorMessage = 'Invalid API key'
        }

        return { valid: false, error: errorMessage }
      }
    } catch {
      return { valid: false, error: 'Validation failed' }
    }
  }
}
