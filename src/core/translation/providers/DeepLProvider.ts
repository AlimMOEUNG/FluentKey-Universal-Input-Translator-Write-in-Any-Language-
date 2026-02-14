/**
 * DeepLProvider - DeepL API translator
 *
 * Uses DeepL API for high-quality translations
 * - Requires API key (free or pro)
 * - Auto-detects free vs pro endpoint
 * - High translation quality
 */

import { BaseTranslationProvider, TranslationOptions } from './BaseTranslationProvider'
import { PROVIDER_BASE_URLS } from '@/config/providers'

interface DeepLTranslationsResponse {
  translations: Array<{ text: string }>
}

// DeepL translate endpoints — base URLs come from the central PROVIDER_BASE_URLS config
const DEEPL_ENDPOINTS = {
  free: `${PROVIDER_BASE_URLS.deeplFree}/translate`,
  pro: `${PROVIDER_BASE_URLS.deeplPro}/translate`,
}

export class DeepLProvider extends BaseTranslationProvider {
  readonly name = 'DeepL'
  readonly requiresApiKey = true

  private apiKey: string

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
  }

  /**
   * Convert ISO 639-1 code to DeepL language code
   */
  private convertToDeepLLangCode(isoCode: string): string {
    return isoCode.toUpperCase()
  }

  /**
   * Make a DeepL API request via PROXY_FETCH
   */
  private async makeDeepLRequest(
    endpoint: string,
    text: string,
    targetLang: string
  ): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
    // Build request params
    const params = new URLSearchParams({
      text,
      target_lang: this.convertToDeepLLangCode(targetLang),
    })

    // Send request via background script (CORS bypass)
    return await chrome.runtime.sendMessage({
      type: 'PROXY_FETCH',
      url: endpoint,
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
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

    const { targetLanguage } = options

    // Try Free API first, fallback to Pro
    const endpoints = [DEEPL_ENDPOINTS.free, DEEPL_ENDPOINTS.pro]
    let lastError: string | undefined

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeDeepLRequest(endpoint, text, targetLanguage)

        if (response.success && response.data) {
          const translation = (response.data as unknown as DeepLTranslationsResponse).translations[0].text

          console.log('[DeepL] Translation successful')
          return translation
        } else if (response.error) {
          // Parse specific error codes
          if (response.error.includes('429')) {
            lastError = 'DeepL quota exceeded. Character limit reached for this billing period.'
          } else if (response.error.includes('403') || response.error.includes('401')) {
            lastError = 'DeepL API key is invalid. Please check your settings.'
          } else {
            lastError = response.error
          }
        }
      } catch (error) {
        console.log(`[DeepL] ${endpoint} failed, trying next...`)
        lastError = error instanceof Error ? error.message : 'Network error'
      }
    }

    this.handleError(
      new Error(lastError || 'DeepL translation failed. Please check your connection.'),
      'Translation failed'
    )
  }

  /**
   * Validate DeepL API key
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return { valid: false, error: 'API key is required' }
    }

    // Try Free API first
    try {
      const response = await this.makeDeepLRequest(DEEPL_ENDPOINTS.free, 'Hello', 'FR')

      if (response.success) {
        return { valid: true }
      }
    } catch {
      console.log('[DeepL] Free API validation failed, trying Pro...')
    }

    // Try Pro API
    try {
      const response = await this.makeDeepLRequest(DEEPL_ENDPOINTS.pro, 'Hello', 'FR')

      if (response.success) {
        return { valid: true }
      } else {
        return { valid: false, error: response.error || 'Invalid API key' }
      }
    } catch {
      return { valid: false, error: 'Validation failed' }
    }
  }
}
