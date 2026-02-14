# LLM Prompt UX — Pending Indicator & Reliability Fixes

## Overview

Two related improvements shipped together:

1. **`verifyInsertion` fix** (`e2c648f`) — prevents a false "Failed to set text value" error when
   LLM output contains paragraph breaks that `contenteditable` editors normalize.
2. **Pending indicator** (current diff) — shows live feedback in the input field while the LLM is
   generating, with automatic restoration of the original text on error or timeout.

---

## 1. `verifyInsertion` Fix (InputHandler.ts)

### Problem

`insertTextWithFallbacks()` verified each insertion attempt with:

```typescript
if (this.getCurrentText(element).includes(text))
```

Editors like Gemini's `contenteditable` normalize `\n\n` paragraph breaks into `<p>` elements whose
`textContent` yields a single `\n`. A long LLM response with paragraph breaks therefore never
matched `.includes(text)`, causing all three insertion methods to report failure in sequence — even
though method 1 already inserted the text correctly. The error popup fired despite the replacement
working visually.

Short texts (< 50 chars, no formatting) never triggered normalization → they passed without issue.

### Fix

Replaced the three separate `.includes()` checks with a shared `verifyInsertion()` helper that adds
a length-change check as a normalization-safe fallback:

```typescript
const textBefore = this.getCurrentText(element)

const verifyInsertion = (): boolean => {
  const current = this.getCurrentText(element)
  if (current.includes(text)) return true           // exact match (standard inputs)
  if (current.length !== textBefore.length) return true  // length changed = replacement happened
  return false
}
```

`textBefore` is the field content before any insertion attempt. If the editor normalizes the text,
`current.includes(text)` is false but `current.length` differs from `textBefore.length` → insertion
is correctly detected.

**Files:** `src/core/handlers/input/InputHandler.ts` — `insertTextWithFallbacks()`

---

## 2. Pending Indicator (KeyboardShortcutHandler.ts + InputHandler.ts + background.ts)

### Problem

LLM prompts can take several seconds. The user had no feedback during this time: no spinner, no
progress, no indication that anything was happening in the background.

### Design Decision

Instead of an overlay or badge, the indicator is written **directly into the input field** where the
user's text lives. This is zero-DOM, works on any site, and requires no Shadow DOM injection.

The indicator is only shown if the LLM takes longer than a configurable threshold (default 500 ms).
Fast responses go straight from original text → result with no visible intermediate state.

### Behavior

```
t=0ms     User presses shortcut → LLM call starts
t=500ms   [if still waiting] Field content becomes:
            <original text>

            ⏳ Generating...
t=1500ms  Field updates to:
            <original text>

            ⏳ Generating... (1s)
t=2500ms  Field updates to:
            <original text>

            ⏳ Generating... (2s)
t=3200ms  LLM responds → field becomes:
            <LLM result>           (selection context: prefix + result + suffix)
```

### Configurable Constants

Both constants live at the top of the `llm-prompt` branch in `processText()`:

```typescript
const PENDING_THRESHOLD_MS = 500   // show indicator only if LLM takes longer than this
const UPDATE_INTERVAL_MS   = 1000  // how often to refresh the elapsed counter
```

### Selection Context Handling

The pending writes use `setTextValue` (full field replace), which destroys the browser's selection
range. To avoid erasing text that was not part of the original selection, the implementation
captures **exact character offsets** of the selection before any DOM modification:

```
InputHandler.getSelectionOffsets(element)
  → { start, end }  (character positions in the plain-text field content)
```

From these offsets, `selectionPrefix` and `selectionSuffix` are computed once. Every pending write
and the final replace reconstruct the full field as:

```
selectionPrefix + <selected text or result> + selectionSuffix
```

`getSelectionOffsets` uses:
- `input` / `textarea` → native `element.selectionStart` / `selectionEnd`
- `contenteditable` → `document.createRange()` pre-range measurement via `toString().length`

Both approaches are **position-based** and immune to duplicate-text ambiguity (unlike `indexOf`).

### Race Condition Prevention

The `setInterval` callback is asynchronous. If the LLM responds while an interval write is still
in-flight, two concurrent `setTextValue` calls would interleave (both calling `selectAll +
insertText`), causing the pending text to be appended to the result instead of replaced.

Prevention mechanism:

1. `pendingWritePromise` always holds the last started `writePending` promise.
2. A `cancelled` flag stops any write that starts after cancellation is requested.
3. In the `finally` block: `cancelled = true` → clear timers → `await pendingWritePromise`.
4. The final replace only starts after the last in-flight write has fully completed.

```typescript
} finally {
  cancelled = true
  if (pendingTimer) clearTimeout(pendingTimer)
  if (updateInterval) clearInterval(updateInterval)
  await pendingWritePromise  // wait for last in-flight write before final replace
}
```

### Error & Timeout Handling

#### 30-second timeout (`background.ts`)

All LLM requests go through `handleProxyFetch` in the service worker. An `AbortController` with a
30-second timeout is attached to every `fetch`:

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30_000)
const response = await fetch(url, { signal: controller.signal, ... })
clearTimeout(timeoutId)
```

An `AbortError` propagates back through `chrome.runtime.sendMessage` → `LLMPromptExecutor.execute`
throws → the outer `catch` in `processText` handles it.

#### Field restoration (`KeyboardShortcutHandler.ts`)

`originalFieldSnapshot` captures the full field content before any pending write. If the LLM call
fails for any reason (abort, network error, API error), the catch block restores the field:

```typescript
if (pendingShown && inputElement && originalFieldSnapshot) {
  await InputHandler.setTextValue(inputElement, originalFieldSnapshot)
}
```

The alert message distinguishes timeout from other failures:

- **Timeout:** `"LLM Prompt timed out after 30 seconds. Your text has been restored."`
- **Other error:** `"LLM Prompt failed: <error message>"`

---

## Files Modified

| File | Change |
|---|---|
| `src/core/handlers/input/InputHandler.ts` | `verifyInsertion()` helper in `insertTextWithFallbacks()`; new `getSelectionOffsets()` public method |
| `src/core/handlers/KeyboardShortcutHandler.ts` | Pending indicator logic in `processText()` llm-prompt branch; error restoration in catch block |
| `src/background.ts` | 30-second `AbortController` timeout in `handleProxyFetch()` |
