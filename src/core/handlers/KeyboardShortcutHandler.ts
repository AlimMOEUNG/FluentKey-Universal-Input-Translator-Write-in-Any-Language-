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
import { TransformationEngine } from '../transformation/TransformationEngine'
import { SettingsManager } from '../storage/SettingsManager'
import { InputHandler } from './input/InputHandler'
import {
  formatShortcutFromEvent,
  normalizeShortcut,
  KeyboardSequenceDetector,
} from '../utils/keyboardUtils'
import type { Preset } from '@/types/common'

export class KeyboardShortcutHandler {
  private isProcessing = false // Prevent concurrent operations
  private shortcutMap = new Map<string, Preset>() // Shortcut → Preset mapping
  private sequenceDetector = new KeyboardSequenceDetector() // Sequence detector for multi-key shortcuts
  private transformationEngine: TransformationEngine // Engine for text transformations

  constructor(
    private engine: TranslationEngine,
    private settings: SettingsManager
  ) {
    this.transformationEngine = new TransformationEngine()
  }

  /**
   * Initialize the handler by setting up keyboard event listener
   */
  initialize(): void {
    this.rebuildShortcutMap()
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
    console.log('[KeyboardShortcut] Handler initialized with presets:', this.shortcutMap.size)
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
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

    for (const preset of presets) {
      const normalized = normalizeShortcut(preset.keyboardShortcut)
      this.shortcutMap.set(normalized, preset)

      // Log different info based on preset type
      if (preset.type === 'transformation') {
        console.log(
          `[KeyboardShortcut] Registered: ${preset.keyboardShortcut} → ${preset.name} (${preset.transformationStyle})`
        )
      } else {
        console.log(
          `[KeyboardShortcut] Registered: ${preset.keyboardShortcut} → ${preset.name} (${preset.sourceLang} → ${preset.targetLang})`
        )
      }
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

    // Prevent default browser behavior and event propagation
    event.preventDefault()
    event.stopPropagation()

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
    try {
      let resultText: string

      // Route based on preset type
      if (preset.type === 'transformation') {
        // SYNCHRONOUS transformation (no API call)
        resultText = this.transformationEngine.transform(text, preset.transformationStyle)
        console.log(
          `[KeyboardShortcut] Text transformed using ${preset.transformationStyle} (${text.length} → ${resultText.length} chars)`
        )
      } else {
        // ASYNCHRONOUS translation
        resultText = await this.engine.translateText(text, preset.sourceLang, preset.targetLang)
        console.log(
          `[KeyboardShortcut] Text translated: ${preset.sourceLang} → ${preset.targetLang} (${text.length} → ${resultText.length} chars)`
        )
      }

      // Apply result based on context
      if (context === 'selection' && inputElement) {
        // Replace selection in input
        const success = await InputHandler.replaceSelectedText(inputElement, resultText)
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
      const operation = preset.type === 'transformation' ? 'Transformation' : 'Translation'
      alert(`${operation} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
