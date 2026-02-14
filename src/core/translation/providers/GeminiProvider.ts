/**
 * GeminiProvider - Google Gemini API translator
 *
 * Uses the OpenAI-compatible Gemini endpoint (v1beta/openai).
 * - Requires API key (Bearer token via Authorization header)
 * - High quality LLM-based translation
 * - Configurable model selection
 */

import { BaseTranslationProvider, TranslationOptions } from './BaseTranslationProvider'
import { PROVIDER_BASE_URLS } from '@/config/providers'

export class GeminiProvider extends BaseTranslationProvider {
  readonly name = 'Google Gemini'
  readonly requiresApiKey = true

  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    super()
    this.apiKey = apiKey
    this.model = model
  }

  /**
   * Make a request to the Gemini OpenAI-compatible endpoint via PROXY_FETCH (CORS bypass).
   */
  private async makeRequest(
    messages: Array<{ role: string; content: string }>
  ): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
    const url = `${PROVIDER_BASE_URLS.gemini}/chat/completions`

    return await chrome.runtime.sendMessage({
      type: 'PROXY_FETCH',
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
      }),
    })
  }

  /**
   * Translate text using the Gemini OpenAI-compatible API.
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
      const userMessage = `Translate the following text to ${targetLanguage}. If the text is already in ${targetLanguage}, return it unchanged. Return ONLY the translation or original text without any explanations, notes, or additional text.\n\nText: "${text}"`

      const response = await this.makeRequest([{ role: 'user', content: userMessage }])

      if (!response.success) {
        let errorMessage = response.error || 'Translation failed'

        if (
          errorMessage.includes('429') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('RESOURCE_EXHAUSTED')
        ) {
          errorMessage =
            'Gemini API quota exceeded. Please check your credits at console.cloud.google.com'
        } else if (
          errorMessage.includes('401') ||
          errorMessage.includes('403') ||
          errorMessage.includes('API_KEY_INVALID')
        ) {
          errorMessage = 'Gemini API key is invalid. Please check your settings.'
        }

        throw new Error(errorMessage)
      }

      // Extract translation from OpenAI-compatible response format
      const translation = (response.data as { choices?: Array<{ message?: { content?: string } }> })
        ?.choices?.[0]?.message?.content?.trim()

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
   * Validate Gemini API key via a lightweight test request.
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return { valid: false, error: 'API key is required' }
    }

    try {
      const response = await this.makeRequest([{ role: 'user', content: 'Test' }])

      if (response.success) {
        return { valid: true }
      }

      let errorMessage = response.error || 'Invalid API key'
      if (errorMessage.includes('API key') || errorMessage.includes('401')) {
        errorMessage = 'Invalid API key'
      }

      return { valid: false, error: errorMessage }
    } catch {
      return { valid: false, error: 'Validation failed' }
    }
  }
}
