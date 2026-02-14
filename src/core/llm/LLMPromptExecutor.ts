import type { LLMProvider } from '@/types/common'
import type { ProviderConfigs } from '@/composables/useSettings'
import { extractApiError } from '@/utils/providerValidation'
import { PROVIDER_BASE_URLS } from '@/config/providers'

const SYSTEM_PROMPT =
  'You are a text processor. Respond ONLY with the processed output. ' +
  'No explanations, no additional text, no markdown formatting.'

interface ResolvedConfig {
  baseUrl: string
  apiKey: string | null
}

/**
 * Read the provider configuration from chrome.storage.local and derive
 * the endpoint base URL and API key for the requested LLM provider.
 */
async function resolveConfig(provider: LLMProvider): Promise<ResolvedConfig> {
  const { providerKeys } = await chrome.storage.local.get('providerKeys')
  const keys = (providerKeys ?? {}) as ProviderConfigs

  switch (provider) {
    case 'gemini':
      return { baseUrl: PROVIDER_BASE_URLS.geminiOpenAI, apiKey: keys.gemini?.apiKey ?? null }
    case 'chatgpt':
      return {
        baseUrl: keys.chatgpt?.baseUrl || PROVIDER_BASE_URLS.chatgpt,
        apiKey: keys.chatgpt?.apiKey ?? null,
      }
    case 'groq':
      return {
        baseUrl: keys.groq?.baseUrl || PROVIDER_BASE_URLS.groq,
        apiKey: keys.groq?.apiKey ?? null,
      }
    case 'ollama':
      return {
        baseUrl: keys.ollama?.baseUrl || PROVIDER_BASE_URLS.ollama,
        apiKey: null,
      }
    case 'openrouter':
      return {
        baseUrl: keys.openrouter?.baseUrl || PROVIDER_BASE_URLS.openrouter,
        apiKey: keys.openrouter?.apiKey ?? null,
      }
    case 'custom':
      return {
        baseUrl: keys.custom?.baseUrl ?? '',
        apiKey: keys.custom?.apiKey ?? null,
      }
  }
}

export class LLMPromptExecutor {
  /**
   * Execute a prompt template against the specified LLM provider.
   * Routes the HTTP request through the background service worker (PROXY_FETCH)
   * to bypass CORS restrictions from content scripts.
   *
   * @param prompt   - Template containing the {{input}} placeholder
   * @param input    - The text that replaces {{input}}
   * @param provider - LLM provider identifier
   * @param model    - Resolved model name (never the literal 'custom')
   * @returns The content string extracted from the LLM response
   */
  static async execute(
    prompt: string,
    input: string,
    provider: LLMProvider,
    model: string
  ): Promise<string> {
    const config = await resolveConfig(provider)

    if (!config.baseUrl) {
      throw new Error(`No base URL configured for provider "${provider}"`)
    }

    const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const userMessage = prompt.replace(/\{\{input\}\}/g, input)

    // Route through background service worker for CORS bypass
    const response = await chrome.runtime.sendMessage({
      type: 'PROXY_FETCH',
      url,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!response.success) {
      // Extract the real API error message from the response body (e.g. "API key not valid")
      const msg = extractApiError(response.data, response.error || 'LLM request failed')
      throw new Error(msg)
    }

    const content = response.data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      throw new Error('Unexpected response format from LLM')
    }

    return content
  }
}
