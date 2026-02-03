/**
 * InputHandler - Universal input field handler
 *
 * Supports multiple input types:
 * - <input type="text">
 * - <textarea>
 * - <div contenteditable="true">
 * - Rich text editors (TinyMCE, CKEditor, etc.)
 */

export type InputType = 'input' | 'textarea' | 'contenteditable' | 'unknown'

// Delay helper for sequencing insertion attempts
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class InputHandler {
  /**
   * Check if an element is editable
   */
  static isEditableElement(element: Element | null): element is HTMLElement {
    if (!element || !(element instanceof HTMLElement)) {
      return false
    }

    // Check for input and textarea
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      const inputElement = element as HTMLInputElement
      // Exclude non-text input types
      if (element.tagName === 'INPUT') {
        const type = inputElement.type?.toLowerCase()
        const textTypes = ['text', 'search', 'url', 'tel', 'email', 'password']
        if (!textTypes.includes(type)) {
          return false
        }
      }
      return !inputElement.disabled && !inputElement.readOnly
    }

    // Check for contenteditable
    if (element.isContentEditable) {
      return true
    }

    return false
  }

  /**
   * Get the type of input element
   */
  static getInputType(element: HTMLElement): InputType {
    if (element.tagName === 'INPUT') {
      return 'input'
    }
    if (element.tagName === 'TEXTAREA') {
      return 'textarea'
    }
    if (element.isContentEditable) {
      return 'contenteditable'
    }
    return 'unknown'
  }

  /**
   * Get text value from input element
   */
  static getTextValue(element: HTMLElement): string {
    const inputType = this.getInputType(element)

    switch (inputType) {
      case 'input':
      case 'textarea':
        return (element as HTMLInputElement | HTMLTextAreaElement).value

      case 'contenteditable':
        // For contenteditable, use textContent (plain text)
        return element.textContent || ''

      default:
        return ''
    }
  }

  /**
   * Set text value in input element (replaces all content)
   */
  static async setTextValue(element: HTMLElement, text: string): Promise<boolean> {
    try {
      element.focus()
      await delay(50)

      // Select all content before replacing
      this.selectAll(element)
      await delay(50)

      return await this.insertTextWithFallbacks(element, text)
    } catch (error) {
      console.error('[InputHandler] Failed to set text value:', error)
      return false
    }
  }

  /**
   * Check if there's a selection in the input
   */
  static hasSelection(element: HTMLElement): boolean {
    const inputType = this.getInputType(element)

    switch (inputType) {
      case 'input':
      case 'textarea': {
        const inputElement = element as HTMLInputElement | HTMLTextAreaElement
        return (
          inputElement.selectionStart !== null &&
          inputElement.selectionEnd !== null &&
          inputElement.selectionStart !== inputElement.selectionEnd
        )
      }

      case 'contenteditable': {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) {
          return false
        }
        const range = selection.getRangeAt(0)
        return !range.collapsed
      }

      default:
        return false
    }
  }

  /**
   * Get selected text from input
   */
  static getSelectedText(element: HTMLElement): string {
    const inputType = this.getInputType(element)

    switch (inputType) {
      case 'input':
      case 'textarea': {
        const inputElement = element as HTMLInputElement | HTMLTextAreaElement
        if (
          inputElement.selectionStart !== null &&
          inputElement.selectionEnd !== null &&
          inputElement.selectionStart !== inputElement.selectionEnd
        ) {
          return inputElement.value.substring(
            inputElement.selectionStart,
            inputElement.selectionEnd
          )
        }
        return ''
      }

      case 'contenteditable': {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) {
          return ''
        }
        return selection.toString()
      }

      default:
        return ''
    }
  }

  /**
   * Replace selected text in input (selection must already exist)
   */
  static async replaceSelectedText(element: HTMLElement, newText: string): Promise<boolean> {
    try {
      element.focus()
      await delay(50)

      return await this.insertTextWithFallbacks(element, newText)
    } catch (error) {
      console.error('[InputHandler] Failed to replace selected text:', error)
      return false
    }
  }

  /**
   * Select all text in input
   */
  static selectAll(element: HTMLElement): boolean {
    const inputType = this.getInputType(element)

    try {
      switch (inputType) {
        case 'input':
        case 'textarea': {
          const inputElement = element as HTMLInputElement | HTMLTextAreaElement
          inputElement.select()
          return true
        }

        case 'contenteditable': {
          const range = document.createRange()
          range.selectNodeContents(element)
          const selection = window.getSelection()
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
            return true
          }
          return false
        }

        default:
          return false
      }
    } catch (error) {
      console.error('[InputHandler] Failed to select all:', error)
      return false
    }
  }

  /**
   * Get the currently focused input element
   */
  static getFocusedInput(): HTMLElement | null {
    const activeElement = document.activeElement as HTMLElement

    if (this.isEditableElement(activeElement)) {
      return activeElement
    }

    return null
  }

  // ─── Private: current text snapshot ────────────────────────────────────

  /**
   * Get current text content of element (used to verify insertion success)
   */
  private static getCurrentText(element: HTMLElement): string {
    if ('value' in element) {
      return (element as HTMLInputElement | HTMLTextAreaElement).value
    }
    return element.textContent || ''
  }

  // ─── Private: insertion orchestrator ────────────────────────────────────

  /**
   * Try all insertion methods in sequence until one actually changes the content.
   * Order: execCommand → ClipboardEvent → InputEvent
   * Each method is verified by comparing text before/after.
   */
  private static async insertTextWithFallbacks(
    element: HTMLElement,
    text: string
  ): Promise<boolean> {
    // Method 1: execCommand('insertText') — works for standard inputs + Slate.js via beforeinput
    if (this.tryExecCommand(element, text)) {
      await delay(100)
      if (this.getCurrentText(element).includes(text)) {
        console.log('[InputHandler] Inserted via execCommand')
        await this.syncContentEditable(element)
        return true
      }
    }

    await delay(100)

    // Method 2: Synthetic ClipboardEvent — catches editors that listen on paste
    if (this.tryClipboardEvent(element, text)) {
      await delay(100)
      if (this.getCurrentText(element).includes(text)) {
        console.log('[InputHandler] Inserted via ClipboardEvent')
        await this.syncContentEditable(element)
        return true
      }
    }

    await delay(100)

    // Method 3: InputEvent only — last resort for frameworks handling insertText natively
    if (this.tryInputEvent(element, text)) {
      await delay(100)
      if (this.getCurrentText(element).includes(text)) {
        console.log('[InputHandler] Inserted via InputEvent')
        await this.syncContentEditable(element)
        return true
      }
    }

    console.warn('[InputHandler] All insertion methods failed')
    return false
  }

  // ─── Private: blur/focus sync for rich editors ─────────────────────────

  /**
   * Some contenteditable editors (Slate.js, etc.) need a blur/focus cycle
   * to sync their internal state after a programmatic DOM change.
   */
  private static async syncContentEditable(element: HTMLElement): Promise<void> {
    if (!element.isContentEditable) return
    element.blur()
    await delay(50)
    element.focus()
  }

  // ─── Private: insertion methods ─────────────────────────────────────────

  /**
   * Method 1: execCommand('insertText') with beforeinput/input events.
   * - If the framework (e.g. Slate.js on Discord) cancels beforeinput, it handles insertion itself.
   * - Otherwise execCommand performs the actual DOM write.
   */
  private static tryExecCommand(element: HTMLElement, text: string): boolean {
    try {
      const doc = element.ownerDocument || document

      // Slate.js / React listen on beforeinput — if cancelled, they handle it
      const beforeInputEvent = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: text,
        bubbles: true,
        cancelable: true,
      })
      const prevented = !element.dispatchEvent(beforeInputEvent)

      if (prevented) {
        // Framework handled the insertion via beforeinput
        return true
      }

      // Perform the actual DOM change
      const success = doc.execCommand('insertText', false, text)

      if (success) {
        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))

        // Position cursor at end for contenteditable
        if (element.isContentEditable) {
          this.moveCursorToEnd(element)
        }
      }

      return success
    } catch {
      return false
    }
  }

  /**
   * Method 2: Synthetic ClipboardEvent with in-memory DataTransfer.
   * No clipboard permission needed — catches editors that intercept paste events.
   */
  private static tryClipboardEvent(element: HTMLElement, text: string): boolean {
    try {
      const dataTransfer = new DataTransfer()
      dataTransfer.setData('text/plain', text)

      element.dispatchEvent(
        new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dataTransfer,
        })
      )

      return true
    } catch {
      return false
    }
  }

  /**
   * Method 3: InputEvent API only — for frameworks that natively handle insertText input events.
   */
  private static tryInputEvent(element: HTMLElement, text: string): boolean {
    try {
      const beforeInputEvent = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: text,
        bubbles: true,
        cancelable: true,
        composed: true,
      })

      const prevented = !element.dispatchEvent(beforeInputEvent)
      if (prevented) {
        return true
      }

      element.dispatchEvent(
        new InputEvent('input', {
          inputType: 'insertText',
          data: text,
          bubbles: true,
          cancelable: false,
          composed: true,
        })
      )

      return true
    } catch {
      return false
    }
  }

  // ─── Cursor positioning ────────────────────────────────────────────────

  /**
   * Move cursor to end of element, clearing any selection.
   * Handles input, textarea, and contenteditable.
   */
  static moveCursorToEnd(element: HTMLElement): void {
    const inputType = this.getInputType(element)

    switch (inputType) {
      case 'input':
      case 'textarea': {
        const inputElement = element as HTMLInputElement | HTMLTextAreaElement
        const end = inputElement.value.length
        inputElement.setSelectionRange(end, end)
        break
      }

      case 'contenteditable': {
        // TreeWalker to find the last text node (handles nested elements)
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
        let lastTextNode: Text | null = null
        let node: Node | null

        while ((node = walker.nextNode())) {
          lastTextNode = node as Text
        }

        if (lastTextNode) {
          const range = document.createRange()
          range.setStart(lastTextNode, lastTextNode.length)
          range.collapse(true)
          const selection = window.getSelection()
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
        break
      }
    }
  }
}
