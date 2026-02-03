# Text Replacement in Inputs

## Why `element.value = text` Doesn't Work

Directly assigning a value to an input element is invisible to modern frameworks.
React, Vue, Slate.js, and other libraries intercept DOM events to track state —
a raw property assignment bypasses all of that, so the framework never knows the
value changed.

| Method                              | React | Vue | Slate.js (Discord) | Plain input |
| ----------------------------------- | ----- | --- | ------------------ | ----------- |
| `element.value = text`              | ❌    | ❌  | ❌                 | ✅          |
| `dispatchEvent(new Event('input'))` | ❌    | ✅  | ❌                 | ✅          |
| `execCommand('insertText')`         | ✅    | ✅  | ✅                 | ✅          |
| Synthetic `ClipboardEvent` (paste)  | ✅    | ✅  | ✅                 | ✅          |

---

## The Three Fallback Methods

`InputHandler.insertTextWithFallbacks()` tries each method in order.
After every attempt it checks whether the target text is actually present in the
element (`getCurrentText().includes(text)`). If not, it moves to the next method.

### Method 1 — `execCommand('insertText')`

The workhorse. Works on standard inputs, textareas, and contenteditable elements.

```
1. Dispatch beforeinput (inputType: 'insertText', data: text)
     ↓
     If framework cancels the event (e.g. Slate.js / Discord)
       → framework handled the insertion itself → done
     ↓
2. document.execCommand('insertText', false, text)
     ↓
3. Dispatch input event
     ↓
4. If contenteditable → moveCursorToEnd (TreeWalker)
```

**Why `beforeinput` first?**
Slate.js (used by Discord, Notion, etc.) listens on `beforeinput`.
When it sees `inputType: 'insertText'`, it cancels the event and performs the
insertion internally. Dispatching `beforeinput` before `execCommand` avoids a
double insertion on those editors.

### Method 2 — Synthetic `ClipboardEvent`

Catches editors that intercept `paste` events but ignore `beforeinput` /
`execCommand`. No clipboard permission is needed — the text is placed in an
in-memory `DataTransfer` object.

```typescript
const dt = new DataTransfer()
dt.setData('text/plain', text)
element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }))
```

### Method 3 — `InputEvent` only

Last resort. Dispatches `beforeinput` + `input` with `composed: true`.
Useful for frameworks that natively consume `insertText` input events without
requiring `execCommand`.

---

## Verification — `.includes(text)` not before/after comparison

After each method attempt the handler checks:

```typescript
if (this.getCurrentText(element).includes(text)) {
  /* success */
}
```

A naive **before ≠ after** check fails when the inserted text is identical to what
was already there (e.g. a transformation that produces the same string, or a
translation that returns the source language). Checking for the presence of the
_target_ text is the only reliable signal of success.

> **Edge case:** if `text` was already a substring of the original content the
> check will return a false positive. In practice this is rare because the
> selection is replaced _before_ the insertion attempt — the original text is
> gone by the time we verify.

---

## ContentEditable Sync — blur/focus cycle

Some rich-text editors (Slate.js, ProseMirror, Tiptap) cache their internal
document model and do not re-read the DOM after a programmatic change. A
`blur → delay(50ms) → focus` cycle forces them to reconcile:

```typescript
private static async syncContentEditable(element: HTMLElement): Promise<void> {
  if (!element.isContentEditable) return
  element.blur()
  await delay(50)
  element.focus()
}
```

This is only applied to `contenteditable` elements — `input`/`textarea` do not
need it and the blur would reset cursor position unnecessarily.

---

## Cursor Positioning

`execCommand('insertText')` naturally places the cursor after the inserted text
for `input` and `textarea`. For `contenteditable`, a `TreeWalker` traversal finds
the last text node and collapses the range there:

```typescript
static moveCursorToEnd(element: HTMLElement): void {
  // input/textarea  →  setSelectionRange(end, end)
  // contenteditable →  TreeWalker → last text node → collapse range
}
```

`moveCursorToEnd` is public and can be called independently when needed.

---

## Full Workflow

```
setTextValue(element, text)                 replaceSelectedText(element, text)
        │                                              │
        ▼                                              ▼
   element.focus()                              element.focus()
   await delay(50)                              await delay(50)
        │                                              │
        ▼                                              │
   selectAll(element)                                  │
   await delay(50)                                     │
        │                                              │
        ▼──────────────────────────────────────────────┘
   insertTextWithFallbacks(element, text)
        │
        ├─ tryExecCommand()   → verify .includes(text) → syncContentEditable
        ├─ tryClipboardEvent()→ verify .includes(text) → syncContentEditable
        └─ tryInputEvent()    → verify .includes(text) → syncContentEditable
```

`setTextValue` selects all content first so that the insertion replaces
everything. `replaceSelectedText` assumes the caller has already set up the
desired selection.

---

## What Was Kept From Each Project

### From `simple-input-translator` (this project)

- **Strict input validation** in `isEditableElement`:
  filters non-text `<input>` types (`checkbox`, `radio`, …) and rejects
  `disabled` / `readOnly` elements.
- **Typed input classification** (`getInputType`) used consistently across all
  public methods.
- **`.includes(text)` verification** — more reliable than before/after comparison.

### From `multiplatform-translator`

- **Three fallback methods** in sequence (`execCommand` → `ClipboardEvent` →
  `InputEvent`), not just a single `execCommand`.
- **`syncContentEditable`** blur/focus cycle for Slate.js / ProseMirror editors.
- **`moveCursorToEnd` via TreeWalker** for reliable cursor positioning in nested
  contenteditable structures.
- **Delays between attempts** to give async editor frameworks time to process.

---

## Applying This to Another Project

If you need the same text-replacement logic elsewhere (e.g. `multiplatform-translator`),
the portable piece is `InputHandler` as a whole. The minimal requirements are:

1. **`insertTextWithFallbacks`** — the three methods + verification loop.
2. **`syncContentEditable`** — blur/focus for rich editors.
3. **`moveCursorToEnd`** — TreeWalker for contenteditable cursor.
4. The `delay` helper.

The validation logic (`isEditableElement`, `getInputType`) is project-specific
and can be adapted or stripped depending on the context.

---

## Related Files

- `src/core/handlers/input/InputHandler.ts` — all insertion logic
- `src/core/handlers/KeyboardShortcutHandler.ts` — calls `setTextValue` /
  `replaceSelectedText`
- `src/content-script.ts` — content script entry point
