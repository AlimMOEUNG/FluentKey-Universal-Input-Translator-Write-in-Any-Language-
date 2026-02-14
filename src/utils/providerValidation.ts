/**
 * Shared provider credential validation utility.
 * Used by ProviderTab (manual validate button) and PresetEditor (auto-validate on save).
 * Sends a lightweight test request via the background PROXY_FETCH handler.
 */

import { PROVIDER_BASE_URLS } from '@/config/providers'
import { translate } from '@/core/utils/i18n'

export interface ValidationResult {
  success: boolean
  error?: string
}

/** Raw shape returned by PROXY_FETCH on failure (background includes the parsed body) */
interface ProxyErrorResponse {
  success: false
  error: string
  data?: Record<string, unknown> | string
}

/**
 * Extract the most human-readable error message from an API error body.
 *
 * API error formats:
 *   OpenAI / ChatGPT / Groq / OpenRouter: { error: { message: "..." } }
 *   Gemini (OpenAI-compat mode):           { error: { message: "..." } }
 *   DeepL:                                 { message: "..." }
 *   Ollama:                                { error: "..." }  (plain string)
 *   Some APIs wrap response in an array:   [{ error: { message: "..." } }]
 *
 * Falls back to the raw HTTP status string when the body is unrecognised.
 */
export function extractApiError(
  data: Record<string, unknown> | string | undefined,
  httpFallback: string
): string {
  // Normalize: some APIs wrap the error object in an array
  const normalized: unknown = Array.isArray(data) ? data[0] : data

  if (!normalized || typeof normalized === 'string') return httpFallback

  const obj = normalized as Record<string, unknown>

  // OpenAI / Gemini / Groq / OpenRouter: { error: { message: "..." } }
  const nestedMsg = obj.error
  if (nestedMsg && typeof nestedMsg === 'object') {
    const msg = (nestedMsg as Record<string, unknown>).message
    if (typeof msg === 'string' && msg) return msg
  }

  // Ollama: { error: "Connection refused" }
  if (typeof nestedMsg === 'string' && nestedMsg) return nestedMsg

  // DeepL: { message: "..." }
  const topMsg = obj.message
  if (typeof topMsg === 'string' && topMsg) return topMsg

  return httpFallback
}

/**
 * Map a raw API error message to a concise, user-friendly message.
 * Covers the most common failure cases: quota/rate-limit, auth, network.
 */
export function toFriendlyApiError(rawMsg: string): string {
  const lower = rawMsg.toLowerCase()

  // HTTP 429 / quota exhausted / rate limit
  if (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('rate_limit') ||
    lower.includes('too many requests')
  ) {
    return translate('errorApiQuotaExceeded')
  }

  // Authentication / authorization
  if (
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('invalid api key') ||
    lower.includes('api_key_invalid') ||
    lower.includes('unauthenticated') ||
    lower.includes('unauthorized') ||
    lower.includes('permission denied')
  ) {
    return translate('errorApiKeyUnauthorized')
  }

  return rawMsg
}

/**
 * Send a PROXY_FETCH request and resolve the result into a clean ValidationResult,
 * surfacing the actual API error message from the response body when available.
 */
async function proxyFetch(
  url: string,
  method: string,
  headers: Record<string, string>
): Promise<ValidationResult> {
  const raw: ProxyErrorResponse | { success: true } = await chrome.runtime.sendMessage({
    type: 'PROXY_FETCH',
    url,
    method,
    headers,
  })

  if (raw.success) return { success: true }

  const errResp = raw as ProxyErrorResponse
  return {
    success: false,
    error: extractApiError(errResp.data, errResp.error),
  }
}

/**
 * Validate credentials for a given provider by sending a test request through PROXY_FETCH.
 *
 * @param provider - Provider identifier (deepl | gemini | chatgpt | groq | ollama | openrouter | custom)
 * @param apiKey   - API key to test (may be empty for providers that don't require one)
 * @param baseUrl  - Base URL override — falls back to the provider default when omitted
 */
export async function validateProviderCredentials(
  provider: string,
  apiKey: string,
  baseUrl?: string
): Promise<ValidationResult> {
  switch (provider) {
    // No credentials required — always valid
    case 'google':
    case 'builtin':
      return { success: true }

    case 'deepl': {
      if (!apiKey) return { success: false, error: 'API key required' }
      // Free keys end with ':fx' and use the free API subdomain
      const deepLBase = apiKey.endsWith(':fx')
        ? PROVIDER_BASE_URLS.deeplFree
        : PROVIDER_BASE_URLS.deeplPro
      return proxyFetch(`${deepLBase}/usage`, 'GET', {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
      })
    }

    case 'gemini': {
      if (!apiKey) return { success: false, error: 'API key required' }
      return proxyFetch(`${PROVIDER_BASE_URLS.gemini}/models`, 'GET', {
        Authorization: `Bearer ${apiKey}`,
      })
    }

    case 'chatgpt':
    case 'groq':
    case 'ollama':
    case 'openrouter':
    case 'custom': {
      const defaultUrl =
        provider !== 'custom'
          ? (PROVIDER_BASE_URLS[provider as keyof typeof PROVIDER_BASE_URLS] as string)
          : ''
      const effectiveBase = (baseUrl || defaultUrl || '').replace(/\/+$/, '')
      if (!effectiveBase) return { success: false, error: 'Base URL required' }
      const headers: Record<string, string> = {}
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      return proxyFetch(`${effectiveBase}/models`, 'GET', headers)
    }

    default:
      return { success: true }
  }
}
