/**
 * KeyboardShortcutHandler - Handles keyboard shortcuts for translation
 *
 * Supports multiple presets, each with its own:
 * - Source language
 * - Target language
 * - Keyboard shortcut
 *
 * Translation behavior:
 * - If selection exists → translate selection
 * - If focus on input → translate entire input content
 * - Otherwise → do nothing
 *
 * Shortcuts are customizable via presets settings (stored in chrome.storage.sync)
 */

import { TranslationEngine } from '../translation/TranslationEngine'
import { TransformationEngine, applyCustomCharMap } from '../transformation/TransformationEngine'
import { SettingsManager } from '../storage/SettingsManager'
import { InputHandler } from './input/InputHandler'
import {
  formatShortcutFromEvent,
  normalizeShortcut,
  KeyboardSequenceDetector,
} from '../utils/keyboardUtils'
import { getCustomTransformById } from '../../services/customTransformService'
import { LLMPromptExecutor } from '../llm/LLMPromptExecutor'
import type { Preset, TranslationProvider } from '@/types/common'
import { ChromeBuiltInProvider } from '../translation/providers/ChromeBuiltInProvider'
import { GoogleTranslateProvider } from '../translation/providers/GoogleTranslateProvider'
import { DeepLProvider } from '../translation/providers/DeepLProvider'
import { GeminiProvider } from '../translation/providers/GeminiProvider'
import {
  OpenAICompatibleProvider,
  getDefaultEndpoint,
  type OpenAIProviderType,
} from '../translation/providers/OpenAICompatibleProvider'
import type { BaseTranslationProvider } from '../translation/providers/BaseTranslationProvider'
import { getEffectiveModel } from '@/config/predefinedModels'

export class KeyboardShortcutHandler {
  private isProcessing = false // Prevent concurrent operations
  private shortcutMap = new Map<string, Preset>() // Shortcut → Preset mapping
  private sequenceDetector = new KeyboardSequenceDetector() // Sequence detector for multi-key shortcuts
  private transformationEngine: TransformationEngine // Engine for text transformations

  // Store bound references so removeEventListener can match them exactly
  private boundHandleKeyDown: (event: KeyboardEvent) => void
  private boundHandleKeyUp: (event: KeyboardEvent) => void

  constructor(
    private engine: TranslationEngine,
    private settings: SettingsManager
  ) {
    this.transformationEngine = new TransformationEngine()
    this.boundHandleKeyDown = this.handleKeyDown.bind(this)
    this.boundHandleKeyUp = this.handleKeyUp.bind(this)
  }

  /**
   * Initialize the handler by setting up keyboard event listeners.
   * Uses capture phase so the extension intercepts shortcuts before the page does.
   */
  initialize(): void {
    this.rebuildShortcutMap()
    document.addEventListener('keydown', this.boundHandleKeyDown, { capture: true })
    document.addEventListener('keyup', this.boundHandleKeyUp, { capture: true })
    console.log('[KeyboardShortcut] Handler initialized with presets:', this.shortcutMap.size)
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.boundHandleKeyDown, { capture: true })
    document.removeEventListener('keyup', this.boundHandleKeyUp, { capture: true })
    this.shortcutMap.clear()
    console.log('[KeyboardShortcut] Handler destroyed')
  }

  /**
   * Rebuild shortcut map from all presets
   * Called on init and when presets change
   */
  rebuildShortcutMap(): void {
    this.shortcutMap.clear()
    const presets = this.settings.getPresets()

    for (let i = 0; i < presets.length; i++) {
      const preset = presets[i]

      // Skip locked presets — they are kept in storage but must not fire shortcuts
      if (this.settings.isPresetLocked(i)) {
        console.log(`[KeyboardShortcut] Skipped (locked): ${preset.name} at index ${i}`)
        continue
      }

      const normalized = normalizeShortcut(preset.keyboardShortcut)
      this.shortcutMap.set(normalized, preset)

      // Log different info based on preset type
      if (preset.type === 'transformation') {
        console.log(
          `[KeyboardShortcut] Registered: ${preset.keyboardShortcut} → ${preset.name} (${preset.transformationStyle})`
        )
      } else if (preset.type === 'custom-transform') {
        console.log(
          `[KeyboardShortcut] Registered: ${preset.keyboardShortcut} → ${preset.name} (custom-transform: ${preset.customTransformId})`
        )
      } else if (preset.type === 'llm-prompt') {
        console.log(
          `[KeyboardShortcut] Registered: ${preset.keyboardShortcut} → ${preset.name} (llm-prompt: ${preset.llmProvider}/${preset.llmModel})`
        )
      } else {
        console.log(
          `[KeyboardShortcut] Registered: ${preset.keyboardShortcut} → ${preset.name} (${preset.sourceLang} → ${preset.targetLang})`
        )
      }
    }
  }

  /**
   * Publicly trigger a preset directly (used by context menu via content script)
   * Reuses the same handleShortcut logic as keyboard shortcuts
   */
  public async triggerPreset(preset: Preset): Promise<void> {
    if (this.isProcessing) {
      console.log('[KeyboardShortcut] Already processing, skipping triggerPreset')
      return
    }
    this.isProcessing = true
    try {
      await this.handleShortcut(preset)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Handle keydown events and detect configured shortcuts
   * Supports both simple shortcuts and multi-key sequences
   */
  private async handleKeyDown(event: KeyboardEvent): Promise<void> {
    // Process the key event through sequence detector
    const sequenceShortcut = this.sequenceDetector.processKeyDown(event)

    // Try both simple shortcut and sequence shortcut
    const simpleShortcut = formatShortcutFromEvent(event)

    // Check if either format matches a preset
    let preset = this.shortcutMap.get(simpleShortcut)
    if (!preset && sequenceShortcut) {
      preset = this.shortcutMap.get(sequenceShortcut)
    }

    // No matching preset found
    if (!preset) {
      return
    }

    // Intercept the event: prevent default browser behavior and stop all propagation
    // stopImmediatePropagation also blocks other capture-phase listeners on the same element
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()

    // Prevent concurrent translations
    if (this.isProcessing) {
      console.log('[KeyboardShortcut] Translation already in progress, skipping')
      return
    }

    console.log(
      `[KeyboardShortcut] Shortcut triggered: ${preset.name} (${preset.keyboardShortcut})`
    )

    try {
      this.isProcessing = true
      await this.handleShortcut(preset)
    } finally {
      this.isProcessing = false
      // Reset sequence after successful shortcut
      this.sequenceDetector.reset()
    }
  }

  /**
   * Handle keyup events to reset sequence detector
   */
  private handleKeyUp(event: KeyboardEvent): void {
    this.sequenceDetector.processKeyUp(event)
  }

  /**
   * Main shortcut logic: detect context and process (translate or transform)
   */
  private async handleShortcut(preset: Preset): Promise<void> {
    // Get focused input if any
    const focusedInput = InputHandler.getFocusedInput()

    // Case 1: If input has selection, process only the selection
    if (focusedInput && InputHandler.hasSelection(focusedInput)) {
      const selection = InputHandler.getSelectedText(focusedInput)
      if (selection && selection.trim().length > 0) {
        console.log(`[KeyboardShortcut] Processing input selection (${selection.length} chars)`)
        await this.processText(focusedInput, selection, preset, 'selection')
        return
      }
    }

    // Case 2: If input is focused, process entire content
    if (focusedInput) {
      const text = InputHandler.getTextValue(focusedInput)
      if (text && text.trim().length > 0) {
        console.log(`[KeyboardShortcut] Processing input content (${text.length} chars)`)
        await this.processText(focusedInput, text, preset, 'content')
        return
      }
    }

    // Case 3: Check if there's a text selection outside of inputs (page selection)
    const pageSelection = window.getSelection()?.toString()
    if (pageSelection && pageSelection.trim().length > 0) {
      console.log(`[KeyboardShortcut] Processing page selection (${pageSelection.length} chars)`)
      await this.processText(null, pageSelection, preset, 'page')
      return
    }

    // Case 4: Nothing to process
    console.log('[KeyboardShortcut] No selection or input focus, skipping')
  }

  /**
   * Process text: apply transformation or translation based on preset type
   * Unified method that routes to appropriate engine
   */
  private async processText(
    inputElement: HTMLElement | null,
    text: string,
    preset: Preset,
    context: 'selection' | 'content' | 'page'
  ): Promise<void> {
    // Declared outside try/catch so both blocks share the same references.
    // Variables set inside the try are read in the catch (restore on error).
    let pendingShown = false
    let selectionPrefix = ''
    let selectionSuffix = ''
    // Full field content before any pending write — restored in catch if LLM fails/times out.
    let originalFieldSnapshot = ''

    try {
      let resultText: string

      // Route based on preset type
      if (preset.type === 'transformation') {
        // SYNCHRONOUS transformation (no API call)
        resultText = this.transformationEngine.transform(text, preset.transformationStyle)
        console.log(
          `[KeyboardShortcut] Text transformed using ${preset.transformationStyle} (${text.length} → ${resultText.length} chars)`
        )
      } else if (preset.type === 'custom-transform') {
        // Load charMap from storage and apply char-by-char substitution
        const transform = await getCustomTransformById(preset.customTransformId)
        if (!transform) {
          throw new Error(`Custom transformation "${preset.customTransformId}" not found`)
        }
        resultText = applyCustomCharMap(text, transform.charMap)
        console.log(
          `[KeyboardShortcut] Text transformed using custom "${transform.name}" (${text.length} → ${resultText.length} chars)`
        )
      } else if (preset.type === 'llm-prompt') {
        // ── Configurable pending-indicator thresholds ──────────────────────────
        // Only show the indicator if the LLM takes longer than PENDING_THRESHOLD_MS.
        // Fast responses (< threshold) go straight from original text to result.
        const PENDING_THRESHOLD_MS = 500 // ms before showing the indicator
        const UPDATE_INTERVAL_MS = 1000 // ms between elapsed-counter refreshes

        let pendingTimer: ReturnType<typeof setTimeout> | null = null
        let updateInterval: ReturnType<typeof setInterval> | null = null
        let elapsedSeconds = 0

        // Tracks the last in-flight writePending promise.
        // Awaited in the finally block to prevent race conditions: if the interval
        // fires a write just as the LLM responds, the final replace must wait for
        // that write to complete before calling setTextValue, otherwise both calls
        // run concurrently and the pending text gets appended to instead of replaced.
        let pendingWritePromise: Promise<void> = Promise.resolve()

        // Guards against writes that start after cancellation is requested.
        // The interval callback fires synchronously but writePending is async —
        // this flag prevents a write that slipped through from executing.
        let cancelled = false

        // Snapshot the full field content so the indicator can be appended after it.
        // Captured here before any DOM modification.
        const originalFullText = inputElement ? InputHandler.getTextValue(inputElement) : ''

        // Also store it at try-block scope for restoration on error/timeout
        originalFieldSnapshot = originalFullText

        // For 'selection' context: capture the exact character offsets of the selection
        // while it is still active (before any pending write clears it).
        // Uses native selectionStart/End for input/textarea and a Range measurement for
        // contenteditable — both are position-based and immune to duplicate-text ambiguity.
        if (context === 'selection' && inputElement) {
          const offsets = InputHandler.getSelectionOffsets(inputElement)
          if (offsets) {
            selectionPrefix = originalFullText.slice(0, offsets.start)
            selectionSuffix = originalFullText.slice(offsets.end)
          }
        }

        // Builds the full field content with the indicator inserted at the right position.
        // 'content' context: indicator appended after the whole original text.
        // 'selection' context: indicator inserted after the selected text, prefix/suffix preserved.
        const buildPendingContent = (indicator: string): string => {
          if (context === 'selection') {
            return selectionPrefix + text + '\n\n' + indicator + selectionSuffix
          }
          return originalFullText + '\n\n' + indicator
        }

        // Writes the pending indicator into the field (full replace preserving surrounding text).
        const writePending = async (indicator: string): Promise<void> => {
          if (!inputElement || cancelled) return
          await InputHandler.setTextValue(inputElement, buildPendingContent(indicator))
        }

        // Only arm the timer when there is an actual input element to write into.
        // For 'page' context (no inputElement) there is nothing to update.
        if (inputElement) {
          pendingTimer = setTimeout(async () => {
            pendingShown = true
            elapsedSeconds = 0
            pendingWritePromise = writePending('⏳ Generating...')
            await pendingWritePromise

            // Refresh the elapsed counter periodically so the user sees progress
            updateInterval = setInterval(() => {
              elapsedSeconds += UPDATE_INTERVAL_MS / 1000
              // Track every new write so finally can await the last one
              pendingWritePromise = writePending(`⏳ Generating... (${elapsedSeconds}s)`)
            }, UPDATE_INTERVAL_MS)
          }, PENDING_THRESHOLD_MS)
        }

        try {
          // Execute prompt template against LLM provider
          resultText = await LLMPromptExecutor.execute(
            preset.prompt,
            text,
            preset.llmProvider,
            preset.llmModel
          )
        } finally {
          // Stop future writes immediately
          cancelled = true
          if (pendingTimer) clearTimeout(pendingTimer)
          if (updateInterval) clearInterval(updateInterval)
          // Wait for any in-flight writePending to complete before the final replace.
          // Without this await, the last interval write and the final setTextValue
          // run concurrently: both call selectAll + insertText and the pending text
          // ends up appended to the result instead of being replaced.
          await pendingWritePromise
        }

        console.log(
          `[KeyboardShortcut] LLM prompt executed via ${preset.llmProvider}/${preset.llmModel} (${text.length} → ${resultText.length} chars)`
        )
      } else {
        // ASYNCHRONOUS translation - check if custom provider or global
        if (preset.useCustomProvider && preset.customProvider) {
          // Use custom provider for this preset
          const customProvider = await this.createCustomProvider(preset.customProvider, preset)
          await customProvider.initialize()
          resultText = await customProvider.translateText(text, {
            targetLanguage: preset.targetLang,
            sourceLanguage: preset.sourceLang,
          })
          customProvider.destroy()
          console.log(
            `[KeyboardShortcut] Text translated using CUSTOM provider ${preset.customProvider}: ${preset.sourceLang} → ${preset.targetLang} (${text.length} → ${resultText.length} chars)`
          )
        } else {
          // Use global provider
          resultText = await this.engine.translateText(text, preset.sourceLang, preset.targetLang)
          console.log(
            `[KeyboardShortcut] Text translated using GLOBAL provider: ${preset.sourceLang} → ${preset.targetLang} (${text.length} → ${resultText.length} chars)`
          )
        }
      }

      // Apply result based on context.
      // When pendingShown is true the original selection range is gone (pending writes replaced
      // the whole field). Use setTextValue and reconstruct the full field content:
      // for 'selection' context, re-inject prefix/suffix around the result so text outside
      // the original selection is preserved.
      if (context === 'selection' && inputElement) {
        const success = pendingShown
          ? await InputHandler.setTextValue(inputElement, selectionPrefix + resultText + selectionSuffix)
          : await InputHandler.replaceSelectedText(inputElement, resultText)
        if (!success) {
          throw new Error('Failed to replace selected text in input')
        }
      } else if (context === 'content' && inputElement) {
        // Replace entire input content
        const success = await InputHandler.setTextValue(inputElement, resultText)
        if (!success) {
          throw new Error('Failed to set text value in input')
        }
      } else if (context === 'page') {
        // Replace page selection using DOM manipulation
        this.replacePageSelection(resultText)
      }
    } catch (error) {
      console.error('[KeyboardShortcut] Processing failed:', error)

      // If the pending indicator was shown, the field contains the indicator text.
      // Restore the original content so the user doesn't lose their work.
      if (pendingShown && inputElement && originalFieldSnapshot) {
        await InputHandler.setTextValue(inputElement, originalFieldSnapshot)
      }

      const operation =
        preset.type === 'transformation' || preset.type === 'custom-transform'
          ? 'Transformation'
          : preset.type === 'llm-prompt'
            ? 'LLM Prompt'
            : 'Translation'

      const isTimeout =
        error instanceof Error &&
        (error.name === 'AbortError' || error.message.toLowerCase().includes('aborted'))

      const message = isTimeout
        ? `${operation} timed out after 30 seconds. Your text has been restored.`
        : `${operation} failed: ${error instanceof Error ? error.message : 'Unknown error'}`

      alert(message)
    }
  }

  /**
   * Create a translation provider instance for a specific provider type
   * Used when a preset has a custom provider configured
   * ONLY uses preset-specific configurations (no fallback to global config)
   */
  private async createCustomProvider(
    providerType: TranslationProvider,
    preset: import('@/types/common').TranslationPreset
  ): Promise<BaseTranslationProvider> {
    // Use ONLY preset-specific config (no fallback to global) - DRY approach
    const config = preset.customProviderConfig || {}

    switch (providerType) {
      case 'builtin':
        return new ChromeBuiltInProvider()

      case 'google':
        return new GoogleTranslateProvider()

      case 'deepl': {
        const apiKey = config.apiKey
        if (!apiKey) {
          throw new Error('DeepL API key is required. Please configure it in the preset settings.')
        }
        return new DeepLProvider(apiKey)
      }

      case 'gemini': {
        const apiKey = config.apiKey
        if (!apiKey) {
          throw new Error('Gemini API key is required. Please configure it in the preset settings.')
        }
        const model = getEffectiveModel(config.model || '', config.customModel)
        if (!model) {
          throw new Error('Gemini model is required. Please configure it in the preset settings.')
        }
        return new GeminiProvider(apiKey, model)
      }

      case 'chatgpt': {
        const apiKey = config.apiKey
        const baseUrl = config.baseUrl || getDefaultEndpoint('chatgpt')

        if (!apiKey) {
          throw new Error(
            'ChatGPT API key is required. Please configure it in the preset settings.'
          )
        }

        const model = getEffectiveModel(config.model || '', config.customModel)
        if (!model) {
          throw new Error('ChatGPT model is required. Please configure it in the preset settings.')
        }

        return new OpenAICompatibleProvider({
          providerType: 'chatgpt' as OpenAIProviderType,
          baseUrl,
          apiKey,
          model,
        })
      }

      case 'groq': {
        const apiKey = config.apiKey
        const baseUrl = config.baseUrl || getDefaultEndpoint('groq')

        if (!apiKey) {
          throw new Error('Groq API key is required. Please configure it in the preset settings.')
        }

        const model = getEffectiveModel(config.model || '', config.customModel)
        if (!model) {
          throw new Error('Groq model is required. Please configure it in the preset settings.')
        }

        return new OpenAICompatibleProvider({
          providerType: 'groq' as OpenAIProviderType,
          baseUrl,
          apiKey,
          model,
        })
      }

      case 'ollama': {
        const baseUrl = config.baseUrl || getDefaultEndpoint('ollama')

        const model = getEffectiveModel(config.model || '', config.customModel)

        if (!model) {
          throw new Error('Ollama model is required. Please configure it in the preset settings.')
        }

        return new OpenAICompatibleProvider({
          providerType: 'ollama' as OpenAIProviderType,
          baseUrl,
          model,
        })
      }

      case 'openrouter': {
        const apiKey = config.apiKey
        const baseUrl = config.baseUrl || getDefaultEndpoint('openrouter')

        if (!apiKey) {
          throw new Error(
            'OpenRouter API key is required. Please configure it in the preset settings.'
          )
        }

        const model = getEffectiveModel(config.model || '', config.customModel)
        if (!model) {
          throw new Error(
            'OpenRouter model is required. Please configure it in the preset settings.'
          )
        }

        return new OpenAICompatibleProvider({
          providerType: 'openrouter' as OpenAIProviderType,
          baseUrl,
          apiKey,
          model,
        })
      }

      case 'custom': {
        const baseUrl = config.baseUrl
        const apiKey = config.apiKey
        const model = config.model

        if (!baseUrl) {
          throw new Error(
            'Custom endpoint base URL is required. Please configure it in the preset settings.'
          )
        }
        if (!model) {
          throw new Error('Custom model is required. Please configure it in the preset settings.')
        }

        return new OpenAICompatibleProvider({
          providerType: 'custom' as OpenAIProviderType,
          baseUrl,
          apiKey,
          model,
        })
      }

      default:
        throw new Error(`Unsupported provider for custom preset: ${providerType}`)
    }
  }

  /**
   * Replace page selection with new text
   * Used for text selected outside of input fields
   */
  private replacePageSelection(text: string): void {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const textNode = document.createTextNode(text)
      range.insertNode(textNode)

      // Select the new text
      const newRange = document.createRange()
      newRange.selectNodeContents(textNode)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
  }
}
