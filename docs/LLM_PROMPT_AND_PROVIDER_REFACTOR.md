# LLM Prompt Mode & Provider Architecture Refactor

## Overview

This document describes all changes introduced in the commit that:
- Fixed the AI Prompt (llm-prompt) mode being completely broken (no auth header sent, raw HTTP errors shown)
- Fixed the same storage key bug in the Translation Engine (Gemini/DeepL/ChatGPT translation broken)
- Added live credential validation on save in PresetEditor (translation + llm-prompt modes)
- Fixed API key draft not persisting across popup close/reopen
- Fixed the `ProviderTab` loading configuration before storage was ready (false "API key required" banner)
- Centralized all provider base URLs into a single source of truth
- Updated Gemini model list to current 2.x lineup

---

## Bug Fixes

### 1. `LLMPromptExecutor` — Missing Authorization header

**File:** `src/core/llm/LLMPromptExecutor.ts`

**Root cause:** `resolveConfig()` was reading from the old `ProviderKeys` type which used suffixed key names
(`geminiConfig`, `chatgptConfig`, `groqConfig`, etc.). The actual storage written by `useSettings` uses flat
`ProviderConfigs` keys (`gemini`, `chatgpt`, `groq`, etc.). The lookup always returned `undefined`, so
no API key was ever read and the Authorization header was never added to requests.

**Fix:** Cast the raw storage object to `ProviderConfigs` and use the correct flat key names.

```typescript
// Before (broken — always undefined)
const keys = (providerKeys ?? {}) as ProviderKeys
case 'gemini': return { ..., apiKey: keys.geminiConfig?.apiKey ?? null }

// After (correct)
const keys = (providerKeys ?? {}) as ProviderConfigs
case 'gemini': return { ..., apiKey: keys.gemini?.apiKey ?? null }
```

---

### 2. `TranslationEngine` — Same storage key bug for translation mode

**File:** `src/core/translation/TranslationEngine.ts`

**Root cause:** Same issue as above — `createProvider()` read `providerKeys?.deeplApiKey`,
`providerKeys?.geminiConfig`, and `` `${provider}Config` `` dynamic keys. All incorrect against
the `ProviderConfigs` storage format.

**Fix:** Read the correct flat keys.

```typescript
// Before (broken)
const apiKey = providerKeys?.deeplApiKey         // DeepL
const geminiConfig = providerKeys?.geminiConfig  // Gemini
const config = providerKeys?.[`${providerType}Config`] // ChatGPT/Groq/Ollama/OpenRouter

// After (correct)
const apiKey = providerKeys?.deepl?.apiKey
const geminiConfig = providerKeys?.gemini
const config = providerKeys?.[providerType]
```

---

### 3. `LLMPromptExecutor` — Raw HTTP error shown to user

**File:** `src/core/llm/LLMPromptExecutor.ts`

**Root cause:** Error handler threw `response.error` verbatim, which was the raw HTTP status string
(`"HTTP 400: Bad Request"`), not the actual API error message.

**Fix:** Use `extractApiError()` to parse the structured error body from the response (works for
OpenAI / Gemini / Groq / OpenRouter `{ error: { message } }`, Ollama `{ error: "..." }`, and
DeepL `{ message: "..." }` formats).

```typescript
// Before
if (!response.success) throw new Error(response.error || 'LLM request failed')

// After
if (!response.success) {
  const msg = extractApiError(response.data, response.error || 'LLM request failed')
  throw new Error(msg)
}
```

---

### 4. `background.ts` — Error response missing parsed body

**File:** `src/background.ts`

**Root cause:** `BackgroundResponse` on error did not include the parsed response body, so callers
couldn't extract the actual API error message.

**Fix:** Added `data?` field to the error variant and pass it from `handleProxyFetch()`.

```typescript
// Before
| { success: false; error: string }

// After
| { success: false; error: string; data?: Record<string, unknown> | string }
```

---

### 5. `ProviderTab` — "API key required" shown before storage loaded

**File:** `src/components/ProviderTab.vue`

**Root cause:** `checkProviderConfiguration()` was called in `onMounted()`, which fires before the
async `chrome.storage.local.get` in `useStorageState` completes. The check always saw empty default
values and incorrectly displayed validation banners.

**Fix:** Replace `onMounted` with `watch(providerConfigsLoading, ...)` (immediate) so the check
runs only after the storage load completes. `providerConfigsLoading` is the new `isLoading` ref
exposed by `useSettings()`.

```typescript
// Before
onMounted(() => { checkProviderConfiguration(); ... })

// After
watch(providerConfigsLoading, (loading) => {
  if (!loading) { checkProviderConfiguration(); ... }
}, { immediate: true })
```

---

### 6. API key draft not persisting across popup close/reopen

**Files:** `src/composables/useDraftPreset.ts`, `src/components/PresetEditor.vue`

**Root cause (two separate bugs):**
1. No `watch()` on `llmApiKeyDraft` / `llmBaseUrlDraft` → `scheduleDraftSave` never triggered when
   only the API key field changed.
2. `llmApiKeyOriginal` and `llmBaseUrlOriginal` were set as `ref('')` during `initLLMCredentialDrafts()`
   which ran before the async `providerConfigs` storage load completed. The "original" was always `''`,
   so after close+reopen the save/undo buttons appeared but the draft value was restored while the
   original stayed `''` — the diff detection was broken.

**Fix:**
- Added `llmApiKeyDraft?` and `llmBaseUrlDraft?` fields to `DraftPresetState` and persist them in
  `scheduleDraftSave`; restore them in `applyDraft`.
- Converted originals from `ref('')` to `computed` that read directly from `providerConfigs`.
  This way they always reflect the current stored value regardless of when storage finishes loading.
- Added explicit `watch(llmApiKeyDraft, scheduleDraftSave)` and `watch(llmBaseUrlDraft, scheduleDraftSave)`.

```typescript
// Before — race condition, value is '' when storage hasn't loaded yet
const llmApiKeyOriginal = ref('')
// set in initLLMCredentialDrafts() — too early

// After — always reflects actual stored value
const llmApiKeyOriginal = computed(() => {
  const provider = (localPreset.value as LLMPromptPreset).llmProvider
  const cfg = providerConfigs.value[provider as keyof ProviderConfigs] as { apiKey?: string }
  return cfg?.apiKey ?? ''
})
```

---

### 7. `useStorageState` — Nested property mutations not saved

**File:** `src/composables/useStorageState.ts`

**Root cause:** The `watch(value, ...)` that auto-saves to storage was missing `{ deep: true }`.
Mutations to nested properties (e.g. `providerConfigs.value.gemini.apiKey = 'xxx'`) were not
triggering a save.

**Fix:** Added `{ deep: true }` to the watcher.

---

## New Features

### Live Credential Validation on Save

**File:** `src/components/PresetEditor.vue`

When a user saves a preset in **translation mode** (custom provider) or **AI Prompt mode**, if the
API key or base URL has changed since the last save, the extension now automatically sends a test
request to verify the credentials before committing. If the test fails, a validation dialog is shown
with the actual API error message and the save is blocked.

An `isSaving` ref disables both Save and Undo buttons while the async validation is in progress.

The logic is extracted into a shared helper `validateCredentials(provider, apiKey, baseUrl?)` to
avoid duplication between the two preset type branches.

---

### API Key and Base URL fields in AI Prompt preset editor

**File:** `src/components/PresetEditor.vue`

The llm-prompt preset editor now displays:
- An **API Key** field (shown when the selected provider requires one)
- A **Base URL** field (shown only for the `custom` provider)

These fields read/write local draft refs (`llmApiKeyDraft`, `llmBaseUrlDraft`) and are only flushed
to the global `providerConfigs` on save. This gives the same save/undo behaviour as other preset
fields, and the dirty check includes credential changes to trigger the save/undo button visibility.

---

### `createDefaultPreset` respects current global provider

**File:** `src/composables/usePresetsSettings.ts`

When adding a new llm-prompt preset, `createDefaultPreset()` now receives the current global
provider. If it is LLM-compatible, it is used as the default `llmProvider` for the new preset
(instead of always defaulting to `gemini`). The default model is resolved from the global provider's
currently configured model, falling back to the first predefined model.

---

## Refactoring

### `providerValidation.ts` — Shared validation utility (new file)

**File:** `src/utils/providerValidation.ts`

Extracted all credential validation logic into a single shared utility used by:
- `ProviderTab.vue` (manual "Test" button)
- `PresetEditor.vue` (auto-validate on save)
- `LLMPromptExecutor.ts` (error parsing via `extractApiError`)

**Exported API:**
```typescript
// Parse the most readable error message from an API response body
export function extractApiError(data, httpFallback): string

// Validate credentials for any provider via PROXY_FETCH
export async function validateProviderCredentials(
  provider: string,
  apiKey: string,
  baseUrl?: string
): Promise<ValidationResult>
```

Handles all provider-specific formats:
- **DeepL** — `GET /usage` with `DeepL-Auth-Key` header; auto-selects free vs pro endpoint
- **Gemini** — `GET /models` via the OpenAI-compatible `v1beta/openai` endpoint
- **ChatGPT / Groq / Ollama / OpenRouter / Custom** — `GET /models` with optional Bearer token
- **Google / Built-in** — always valid (no credentials)

---

### `PROVIDER_BASE_URLS` — Single source of truth for all provider URLs

**File:** `src/config/providers.ts`

All provider base URLs are now defined in one place and imported everywhere else.
**No URL string is hardcoded outside this file.**

```typescript
export const PROVIDER_BASE_URLS = {
  chatgpt:      'https://api.openai.com/v1',
  groq:         'https://api.groq.com/openai/v1',
  ollama:       'http://localhost:11434/v1',
  openrouter:   'https://openrouter.ai/api/v1',
  // Gemini exposes two distinct endpoints — both use v1beta, NOT v1
  geminiOpenAI: 'https://generativelanguage.googleapis.com/v1beta/openai', // OpenAI-compat (LLM prompt + validation)
  geminiNative: 'https://generativelanguage.googleapis.com/v1beta/models', // Native REST (translation provider)
  deeplFree:    'https://api-free.deepl.com/v2',
  deeplPro:     'https://api.deepl.com/v2',
} as const
```

**Files updated to use `PROVIDER_BASE_URLS`:**
- `src/utils/providerValidation.ts`
- `src/core/llm/LLMPromptExecutor.ts`
- `src/core/translation/providers/OpenAICompatibleProvider.ts`
- `src/core/translation/providers/GeminiProvider.ts`
- `src/core/translation/providers/DeepLProvider.ts`
- `src/composables/useSettings.ts`
- `src/components/PresetEditor.vue`

---

### `ProviderTab.vue` — Removed duplicate validation logic

**File:** `src/components/ProviderTab.vue`

The manual provider test button previously contained a full `switch` statement duplicating the
validation logic for each provider (with separate `VALIDATE_DEEPL_KEY`, `VALIDATE_GEMINI_KEY`,
and `VALIDATE_OPENAI_COMPATIBLE` message types). Replaced with a single call to
`validateProviderCredentials()` from the shared utility.

---

### `savePreset()` — Extracted `validateCredentials()` helper

**File:** `src/components/PresetEditor.vue`

The `isSaving / try / validateProviderCredentials / showValidationError / finally` pattern was
identical in both the `translation` and `llm-prompt` branches of `savePreset()`. Extracted into:

```typescript
async function validateCredentials(provider, apiKey, baseUrl?): Promise<boolean>
```

Both branches now call `if (!await validateCredentials(...)) return`.

---

## Configuration Updates

### Gemini default model: `gemini-2.0-flash`

**Files:** `src/composables/useSettings.ts`, `src/core/translation/TranslationEngine.ts`,
`src/core/translation/providers/GeminiProvider.ts`

Changed the hardcoded fallback default from `gemini-1.5-flash` to `gemini-2.0-flash`.

### Gemini model list updated to 2.x lineup

**File:** `src/config/predefinedModels.ts`

Removed legacy 1.x models, added current 2.x lineup:

| Added | Removed |
|---|---|
| `gemini-2.5-pro` | `gemini-2.0-flash-exp` |
| `gemini-2.5-flash` | `gemini-1.5-flash` |
| `gemini-2.5-flash-lite` | `gemini-1.5-flash-8b` |
| `gemini-2.0-flash` | `gemini-1.5-pro` |
| `gemini-2.0-flash-001` | `gemini-pro (Legacy)` |
| `gemini-2.0-flash-lite` | |
| `gemini-2.0-flash-lite-001` | |

OpenRouter Gemini models also updated (`gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.0-flash`).

### Default keyboard shortcut: `Alt+T` (was `Ctrl+Alt+T`)

**Files:** `src/composables/usePresetsSettings.ts`, `src/composables/useSettings.ts`,
`src/core/storage/SettingsManager.ts`, `src/config/defaultPresets.ts`

`Ctrl+Alt+T` conflicts with the system terminal shortcut on Linux. Changed everywhere the default
is defined.

---

## Files Changed Summary

| File | Type | Description |
|---|---|---|
| `src/utils/providerValidation.ts` | **New** | Shared credential validation utility |
| `src/background.ts` | Fix | Include `data` in error response for error parsing |
| `src/components/PresetEditor.vue` | Feature + Fix | API key fields, validation on save, draft fix, DRY |
| `src/components/ProviderTab.vue` | Refactor + Fix | Use shared validation, fix loading race condition |
| `src/composables/useDraftPreset.ts` | Fix | Add credential draft fields to `DraftPresetState` |
| `src/composables/usePresetsSettings.ts` | Feature | New preset inherits current global provider |
| `src/composables/useSettings.ts` | Fix + Refactor | Expose `isLoading`, use `PROVIDER_BASE_URLS` |
| `src/composables/useStorageState.ts` | Fix | Add `deep: true` to auto-save watcher |
| `src/config/defaultPresets.ts` | Config | Default shortcut `Alt+T` |
| `src/config/predefinedModels.ts` | Config | Updated Gemini 2.x model list |
| `src/config/providers.ts` | **New export** | `PROVIDER_BASE_URLS` constant |
| `src/core/llm/LLMPromptExecutor.ts` | Fix | Correct storage key names, parse API errors |
| `src/core/storage/SettingsManager.ts` | Config | Default shortcut `Alt+T` |
| `src/core/translation/TranslationEngine.ts` | Fix | Correct storage key names |
| `src/core/translation/providers/DeepLProvider.ts` | Refactor | Use `PROVIDER_BASE_URLS` |
| `src/core/translation/providers/GeminiProvider.ts` | Refactor | Use `PROVIDER_BASE_URLS` |
| `src/core/translation/providers/OpenAICompatibleProvider.ts` | Refactor | Use `PROVIDER_BASE_URLS` |
