/**
 * WordSelectionHandler - Handle word-by-word selection with Modifier+Arrow keys
 *
 * Features:
 * - Modifier+RightArrow: Extend selection to next word
 * - Modifier+LeftArrow: Extend selection to previous word
 * - Works in inputs, textareas, and contenteditable elements
 * - The modifier key is configurable (default: Alt)
 */

import type { SelectionModifier } from '@/types/common'
import { InputHandler } from './InputHandler'

export class WordSelectionHandler {
  private enabled: boolean = true
  // The modifier key to use for word selection (configurable, default Alt)
  private modifier: SelectionModifier = 'Alt'
  // Stored bound reference so removeEventListener can match the exact same function
  private boundHandleKeyDown: (event: KeyboardEvent) => void

  constructor() {
    this.boundHandleKeyDown = this.handleKeyDown.bind(this)
  }

  /**
   * Initialize the handler using capture phase so our handler runs before
   * any page-level event listeners (e.g. Reddit, Google Docs, etc.)
   */
  initialize(): void {
    document.addEventListener('keydown', this.boundHandleKeyDown, { capture: true })
    console.log('[WordSelection] Handler initialized with modifier:', this.modifier)
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.boundHandleKeyDown, { capture: true })
    console.log('[WordSelection] Handler destroyed')
  }

  /**
   * Update the modifier key used for word selection
   */
  setModifier(modifier: SelectionModifier): void {
    this.modifier = modifier
    console.log('[WordSelection] Modifier updated to:', modifier)
  }

  /**
   * Enable word selection
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * Disable word selection
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * Check if the configured modifier key is active in the given keyboard event
   */
  private isModifierActive(event: KeyboardEvent): boolean {
    switch (this.modifier) {
      case 'Alt':
        return event.altKey && !event.ctrlKey && !event.metaKey
      case 'Ctrl':
        return event.ctrlKey && !event.altKey && !event.metaKey
      case 'Shift':
        return event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey
      case 'Meta':
        return event.metaKey && !event.altKey && !event.ctrlKey
      default:
        return event.altKey && !event.ctrlKey && !event.metaKey
    }
  }

  /**
   * Traverse shadow roots recursively to find the truly focused element.
   * document.activeElement only returns the shadow host, not the element
   * inside the shadow DOM that actually has focus.
   */
  private getDeepActiveElement(): Element | null {
    let element: Element | null = document.activeElement
    while (element?.shadowRoot) {
      element = element.shadowRoot.activeElement
    }
    return element
  }

  /**
   * Handle keydown events and detect Modifier+Arrow combinations
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return

    // Check if the configured modifier key is pressed with arrow keys
    if (!this.isModifierActive(event)) return

    // Traverse shadow roots to find the real focused element
    const activeElement = this.getDeepActiveElement() as HTMLElement
    if (!InputHandler.isEditableElement(activeElement)) {
      return
    }

    // Handle Modifier+RightArrow
    if (event.key === 'ArrowRight') {
      // Prevent default browser behavior AND stop the event from reaching page scripts
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.selectNextWord(activeElement)
      return
    }

    // Handle Modifier+LeftArrow
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.selectPreviousWord(activeElement)
      return
    }
  }

  /**
   * Extend selection to the next word
   */
  private selectNextWord(element: HTMLElement): void {
    const inputType = InputHandler.getInputType(element)

    if (inputType === 'input' || inputType === 'textarea') {
      this.selectNextWordInInput(element as HTMLInputElement | HTMLTextAreaElement)
    } else if (inputType === 'contenteditable') {
      this.selectNextWordInContentEditable()
    }
  }

  /**
   * Extend selection to the previous word
   */
  private selectPreviousWord(element: HTMLElement): void {
    const inputType = InputHandler.getInputType(element)

    if (inputType === 'input' || inputType === 'textarea') {
      this.selectPreviousWordInInput(element as HTMLInputElement | HTMLTextAreaElement)
    } else if (inputType === 'contenteditable') {
      this.selectPreviousWordInContentEditable()
    }
  }

  /**
   * Extend or shrink selection by one word to the right in input/textarea.
   *
   * Uses selectionDirection to know which end is the "active" (focus) end,
   * exactly like selection.modify('extend', 'forward', 'word') does for
   * contenteditable elements:
   * - direction 'backward' : active end is selectionStart → move it forward (shrink)
   * - direction 'forward' or 'none' : active end is selectionEnd → extend it forward
   *
   * Special case: if the cursor is in the middle of a word (collapsed, surrounded
   * by word chars on both sides), select the entire word with the cursor at the end.
   */
  private selectNextWordInInput(element: HTMLInputElement | HTMLTextAreaElement): void {
    const value = element.value
    const start = element.selectionStart ?? 0
    const end = element.selectionEnd ?? 0
    const dir = element.selectionDirection

    if (dir === 'backward' && start !== end) {
      // Active end is selectionStart — move it forward to shrink
      const newStart = Math.min(this.findNextWordBoundary(value, start), end)
      element.setSelectionRange(newStart, end, newStart < end ? 'backward' : 'none')
    } else {
      // Active end is selectionEnd — extend it forward
      // If cursor is collapsed in the middle of a word, select the whole word
      if (
        start === end &&
        end > 0 &&
        end < value.length &&
        this.isWordChar(value[end]) &&
        this.isWordChar(value[end - 1])
      ) {
        const wordStart = this.findCurrentWordStart(value, end)
        const wordEnd = this.findCurrentWordEnd(value, end)
        element.setSelectionRange(wordStart, wordEnd, 'forward')
      } else {
        const newEnd = this.findNextWordBoundary(value, end)
        element.setSelectionRange(start, newEnd, 'forward')
      }
    }
  }

  /**
   * Extend or shrink selection by one word to the left in input/textarea.
   *
   * - direction 'forward' : active end is selectionEnd → move it backward (shrink)
   * - direction 'backward' or 'none' : active end is selectionStart → extend it backward
   *
   * Special case: if the cursor is in the middle of a word (collapsed, surrounded
   * by word chars on both sides), select the entire word with the cursor at the start.
   */
  private selectPreviousWordInInput(element: HTMLInputElement | HTMLTextAreaElement): void {
    const value = element.value
    const start = element.selectionStart ?? 0
    const end = element.selectionEnd ?? 0
    const dir = element.selectionDirection

    if (dir === 'forward' && start !== end) {
      // Active end is selectionEnd — move it backward to shrink
      const newEnd = Math.max(this.findPreviousWordBoundary(value, end), start)
      element.setSelectionRange(start, newEnd, newEnd > start ? 'forward' : 'none')
    } else {
      // Active end is selectionStart — extend it backward
      // If cursor is collapsed in the middle of a word, select the whole word
      if (
        start === end &&
        start > 0 &&
        start < value.length &&
        this.isWordChar(value[start]) &&
        this.isWordChar(value[start - 1])
      ) {
        const wordStart = this.findCurrentWordStart(value, start)
        const wordEnd = this.findCurrentWordEnd(value, start)
        element.setSelectionRange(wordStart, wordEnd, 'backward')
      } else {
        const newStart = this.findPreviousWordBoundary(value, start)
        element.setSelectionRange(newStart, end, 'backward')
      }
    }
  }

  /**
   * Select next word in contenteditable element
   */
  private selectNextWordInContentEditable(): void {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    try {
      // Use Selection API modify method (works in most browsers)
      selection.modify('extend', 'forward', 'word')
    } catch (error) {
      console.warn('[WordSelection] Failed to modify selection:', error)
    }
  }

  /**
   * Select previous word in contenteditable element
   */
  private selectPreviousWordInContentEditable(): void {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    try {
      // Use Selection API modify method (works in most browsers)
      selection.modify('extend', 'backward', 'word')
    } catch (error) {
      console.warn('[WordSelection] Failed to modify selection:', error)
    }
  }

  /**
   * Find the start of the word that contains the given position.
   * Walks backward while the preceding character is a word character.
   */
  private findCurrentWordStart(text: string, pos: number): number {
    let p = pos
    while (p > 0 && this.isWordChar(text[p - 1])) {
      p--
    }
    return p
  }

  /**
   * Find the end of the word that contains the given position.
   * Walks forward while the current character is a word character.
   */
  private findCurrentWordEnd(text: string, pos: number): number {
    let p = pos
    while (p < text.length && this.isWordChar(text[p])) {
      p++
    }
    return p
  }

  /**
   * Find the next word boundary in text
   * A word boundary is a space, punctuation, or end of text
   */
  private findNextWordBoundary(text: string, startPos: number): number {
    if (startPos >= text.length) return text.length

    // Skip current word characters
    let pos = startPos
    while (pos < text.length && this.isWordChar(text[pos])) {
      pos++
    }

    // Skip whitespace
    while (pos < text.length && this.isWhitespace(text[pos])) {
      pos++
    }

    // Include the next word
    while (pos < text.length && this.isWordChar(text[pos])) {
      pos++
    }

    return pos
  }

  /**
   * Find the previous word boundary in text
   */
  private findPreviousWordBoundary(text: string, startPos: number): number {
    if (startPos <= 0) return 0

    // Move back one position
    let pos = startPos - 1

    // Skip whitespace
    while (pos > 0 && this.isWhitespace(text[pos])) {
      pos--
    }

    // Skip word characters to find beginning of word
    while (pos > 0 && this.isWordChar(text[pos - 1])) {
      pos--
    }

    return pos
  }

  /**
   * Check if character is a word character (letter, number, or underscore)
   */
  private isWordChar(char: string): boolean {
    return /[\w\u00C0-\u024F\u1E00-\u1EFF]/.test(char)
  }

  /**
   * Check if character is whitespace
   */
  private isWhitespace(char: string): boolean {
    return /\s/.test(char)
  }
}
