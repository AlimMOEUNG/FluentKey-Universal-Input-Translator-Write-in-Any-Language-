/**
 * Background script for simple input translator
 * Acts as generic CORS proxy for all API calls
 * Also manages the right-click context menu for the pinned preset
 */

import type { Preset, PresetsSettings } from '@/types/common'
import { createOnboardingPresetsSettings } from '@/config/defaultPresets'

// Message types for API proxy and context menu
type BackgroundMessage =
  | {
      type: 'PROXY_FETCH'
      url: string
      method?: string
      headers?: Record<string, string>
      body?: string
    }
  | {
      type: 'TRIGGER_PINNED_PRESET'
    }

type BackgroundResponse =
  | { success: true; data?: Record<string, unknown> | string }
  // data is included on error so callers can extract the API error body (e.g. { error: { message } })
  | { success: false; error: string; data?: Record<string, unknown> | string }

// Context menu item ID for the pinned preset action
const CONTEXT_MENU_ID = 'translate-pinned-preset'

console.log('[Background] PowerInput initialized')

/**
 * Retrieve the pinned preset name from storage (async)
 * Falls back to the first preset's name if pinnedPresetId is missing or stale
 */
async function getPinnedPresetName(): Promise<string> {
  try {
    const result = await chrome.storage.sync.get('presetsSettings')
    const settings: PresetsSettings | undefined = result.presetsSettings
    if (!settings || !settings.presets || settings.presets.length === 0) {
      return 'Translate'
    }

    const pinnedId = settings.pinnedPresetId
    if (pinnedId) {
      const preset = settings.presets.find((p: Preset) => p.id === pinnedId)
      if (preset) return preset.name
    }

    // Fallback to first preset
    return settings.presets[0].name
  } catch {
    return 'Translate'
  }
}

/**
 * Create (or recreate) the context menu item with the pinned preset name.
 * Called at module level so the menu is recreated when the service worker restarts.
 */
async function setupContextMenu(): Promise<void> {
  try {
    // Remove existing item first to avoid "already exists" errors on SW restart
    try {
      chrome.contextMenus.remove(CONTEXT_MENU_ID)
    } catch {
      // Ignore error if item doesn't exist yet
    }

    const title = await getPinnedPresetName()

    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title,
      contexts: ['selection'], // Only show when text is selected
    })

    console.log('[Background] Context menu created with title:', title)
  } catch (error) {
    console.error('[Background] Failed to setup context menu:', error)
  }
}

/**
 * Update the context menu title without recreating the item
 */
async function updateContextMenuTitle(): Promise<void> {
  try {
    const title = await getPinnedPresetName()
    chrome.contextMenus.update(CONTEXT_MENU_ID, { title })
    console.log('[Background] Context menu title updated to:', title)
  } catch (error) {
    // Item may not exist yet; recreate it
    console.warn('[Background] Context menu update failed, recreating:', error)
    await setupContextMenu()
  }
}

// Setup context menu at module level (handles SW restarts in MV3)
setupContextMenu()

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[Background] Extension installed — writing onboarding presets')

    // Write the onboarding presets synchronously before the popup can open,
    // so loadFromStorage() always hits Case 1 (existing data) on first open.
    const defaultSettings = createOnboardingPresetsSettings()
    await chrome.storage.sync.set({
      presetsSettings: defaultSettings,
      themeMode: 'auto',
      locale: 'en',
    })

    console.log('[Background] Onboarding presets written to storage')
  }

  // Recreate context menu on install/update
  setupContextMenu()
})

// Update context menu title when presetsSettings change in storage
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync' || !changes.presetsSettings) return

  const newSettings: PresetsSettings | undefined = changes.presetsSettings.newValue
  const oldSettings: PresetsSettings | undefined = changes.presetsSettings.oldValue

  if (!newSettings) return

  // Check if the pinned preset ID changed or the pinned preset's name changed
  const pinnedIdChanged = newSettings.pinnedPresetId !== oldSettings?.pinnedPresetId

  const pinnedId = newSettings.pinnedPresetId
  const newPinnedPreset = pinnedId
    ? newSettings.presets.find((p: Preset) => p.id === pinnedId)
    : newSettings.presets[0]
  const oldPinnedPreset = oldSettings?.pinnedPresetId
    ? oldSettings.presets?.find((p: Preset) => p.id === oldSettings.pinnedPresetId)
    : oldSettings?.presets?.[0]

  const pinnedNameChanged = newPinnedPreset?.name !== oldPinnedPreset?.name

  if (pinnedIdChanged || pinnedNameChanged) {
    updateContextMenuTitle()
  }
})

// Handle right-click context menu click: send TRIGGER_PINNED_PRESET to the active tab
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return
  if (!tab?.id) return

  chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_PINNED_PRESET' }).catch((error) => {
    // Silently fail for tabs without content script (e.g., chrome:// pages)
    console.warn('[Background] Failed to send TRIGGER_PINNED_PRESET to tab:', tab.id, error)
  })
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
  // Abort the request if the LLM takes longer than 30 seconds
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(message.url, {
      method: message.method || 'GET',
      headers: message.headers || {},
      body: message.body,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    // Parse response based on content type
    const contentType = response.headers.get('content-type')
    let data: Record<string, unknown> | string

    if (contentType?.includes('application/json')) {
      data = (await response.json()) as Record<string, unknown>
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      // Include the parsed body so callers can surface the actual API error message
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        data,
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
