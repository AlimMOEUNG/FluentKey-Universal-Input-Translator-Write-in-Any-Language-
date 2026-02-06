/**
 * Background script for simple input translator
 * Acts as generic CORS proxy for all API calls
 */

// Message types for API proxy
type BackgroundMessage = {
  type: 'PROXY_FETCH'
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string
}

type BackgroundResponse = { success: true; data?: any } | { success: false; error: string }

console.log('[Background] Simple Input Translator initialized')

// Initialize default settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Background] Extension installed')
    chrome.storage.sync.set({
      settings: {
        sourceLang: 'auto',
        targetLang: 'en',
        provider: 'google', // Default to Google Translate (free, no API key)
        keyboardShortcut: 'Alt+T',
      },
      themeMode: 'auto',
      locale: 'en',
    })
  }
})

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Background] Received message:', message.type)

  handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((error) => sendResponse({ success: false, error: error.message }))

  return true // Keep channel open for async response
})

/**
 * Generic PROXY_FETCH handler for CORS bypass
 * Allows content scripts to make cross-origin requests
 */
async function handleProxyFetch(message: {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string
}): Promise<BackgroundResponse> {
  try {
    const response = await fetch(message.url, {
      method: message.method || 'GET',
      headers: message.headers || {},
      body: message.body,
    })

    // Parse response based on content type
    const contentType = response.headers.get('content-type')
    let data: any

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[Background] PROXY_FETCH error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Route message to appropriate handler
 */
async function handleMessage(message: BackgroundMessage): Promise<BackgroundResponse> {
  if (message.type === 'PROXY_FETCH') {
    return await handleProxyFetch(message)
  }

  return { success: false, error: 'Unknown message type' }
}
