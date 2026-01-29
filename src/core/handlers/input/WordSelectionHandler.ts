/**
 * WordSelectionHandler - Handle word-by-word selection with Alt+Arrow keys
 *
 * Features:
 * - Alt+RightArrow: Extend selection to next word
 * - Alt+LeftArrow: Extend selection to previous word
 * - Works in inputs, textareas, and contenteditable elements
 */

import { InputHandler } from './InputHandler'

export class WordSelectionHandler {
  private enabled: boolean = true

  /**
   * Initialize the handler by setting up keyboard event listener
   */
  initialize(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    console.log('[WordSelection] Handler initialized')
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    console.log('[WordSelection] Handler destroyed')
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
   * Handle keydown events and detect Alt+Arrow combinations
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return

    // Check if Alt key is pressed with arrow keys
    if (!event.altKey) return

    // Check if focus is on an editable element
    const activeElement = document.activeElement as HTMLElement
    if (!InputHandler.isEditableElement(activeElement)) {
      return
    }

    // Handle Alt+RightArrow
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      this.selectNextWord(activeElement)
      return
    }

    // Handle Alt+LeftArrow
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
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
   * Select next word in input/textarea
   */
  private selectNextWordInInput(element: HTMLInputElement | HTMLTextAreaElement): void {
    const value = element.value
    let start = element.selectionStart ?? 0
    const end = element.selectionEnd ?? 0

    // If there's a selection, start from the end
    if (start !== end) {
      start = end
    }

    // Find next word boundary
    const newEnd = this.findNextWordBoundary(value, start)

    // Update selection
    element.selectionStart = start
    element.selectionEnd = newEnd
  }

  /**
   * Select previous word in input/textarea
   */
  private selectPreviousWordInInput(element: HTMLInputElement | HTMLTextAreaElement): void {
    const value = element.value
    const start = element.selectionStart ?? 0
    let end = element.selectionEnd ?? 0

    // If there's a selection, start from the beginning
    if (start !== end) {
      end = start
    }

    // Find previous word boundary
    const newStart = this.findPreviousWordBoundary(value, end)

    // Update selection
    element.selectionStart = newStart
    element.selectionEnd = end
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
