/**
 * OpenAICompatibleProvider - OpenAI-compatible API translator
 *
 * Supports multiple OpenAI-compatible services:
 * - ChatGPT (OpenAI)
 * - Groq (fast and free)
 * - Ollama (local, private)
 * - OpenRouter (multiple models)
 * - Custom endpoints
 */

import { BaseTranslationProvider, TranslationOptions } from './BaseTranslationProvider'

export type OpenAIProviderType = 'chatgpt' | 'groq' | 'ollama' | 'openrouter' | 'custom'

export interface OpenAIConfig {
  providerType: OpenAIProviderType
  baseUrl: string
  apiKey?: string // Optional for Ollama
  model: string
}

// Default endpoints for each provider type
const DEFAULT_ENDPOINTS: Record<OpenAIProviderType, string> = {
  chatgpt: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  ollama: 'http://localhost:11434/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  custom: '', // User-provided
}

export class OpenAICompatibleProvider extends BaseTranslationProvider {
  readonly name: string
  readonly requiresApiKey: boolean

  private config: OpenAIConfig

  constructor(config: OpenAIConfig) {
    super()
    this.config = config

    // Set name based on provider type
    switch (config.providerType) {
      case 'chatgpt':
        this.name = 'ChatGPT'
        break
      case 'groq':
        this.name = 'Groq'
        break
      case 'ollama':
        this.name = 'Ollama'
        break
      case 'openrouter':
        this.name = 'OpenRouter'
        break
      case 'custom':
        this.name = 'Custom OpenAI'
        break
    }

    // Ollama doesn't require API key
    this.requiresApiKey = config.providerType !== 'ollama'
  }

  /**
   * Get the full API endpoint URL
   */
  private getEndpointUrl(): string {
    let url = this.config.baseUrl

    // If URL doesn't end with /chat/completions, add it
    if (!url.endsWith('/chat/completions')) {
      url = url.replace(/\/$/, '') + '/chat/completions'
    }

    return url
  }

  /**
   * Translate text using OpenAI-compatible API
   */
  async translateText(text: string, options: TranslationOptions): Promise<string> {
    if (!this.isValidText(text)) {
      return text
    }

    if (this.requiresApiKey && !this.config.apiKey) {
      this.handleError(new Error('API key is required'), 'Translation failed')
    }

    const { targetLanguage } = options

    try {
      // Build prompt for translation
      const prompt = `Translate the following text to ${targetLanguage}. If the text is already in ${targetLanguage}, return it unchanged. Return ONLY the translation or original text without any explanations, notes, or additional text.\n\nText: "${text}"`

      // Build request headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add Authorization header if API key is provided
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
      }

      // Send request via background script (CORS bypass)
      const response = await chrome.runtime.sendMessage({
        type: 'PROXY_FETCH',
        url: this.getEndpointUrl(),
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (!response.success) {
        throw new Error(response.error || 'Translation failed')
      }

      // Extract translation from response
      const translation = response.data?.choices?.[0]?.message?.content?.trim()

      if (!translation) {
        throw new Error('No translation returned from API')
      }

      console.log(`[${this.name}] Translation successful`)
      return translation
    } catch (error) {
      this.handleError(error, 'Translation failed')
    }
  }

  /**
   * Validate OpenAI-compatible API configuration
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    if (this.requiresApiKey && !this.config.apiKey) {
      return { valid: false, error: 'API key is required' }
    }

    try {
      // Build request headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add Authorization header if API key is provided
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
      }

      // Send a simple test request to validate configuration
      const response = await chrome.runtime.sendMessage({
        type: 'PROXY_FETCH',
        url: this.getEndpointUrl(),
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5,
        }),
      })

      if (!response.success) {
        return { valid: false, error: response.error || 'Invalid configuration' }
      }

      return { valid: true }
    } catch {
      return { valid: false, error: 'Validation failed' }
    }
  }
}

/**
 * Get default endpoint for a provider type
 */
export function getDefaultEndpoint(providerType: OpenAIProviderType): string {
  return DEFAULT_ENDPOINTS[providerType]
}
