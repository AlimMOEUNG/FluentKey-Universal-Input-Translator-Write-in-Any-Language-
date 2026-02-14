/**
 * Onboarding presets factory — no Vue dependency, safe to import from background.ts.
 * Called on first install (onInstalled event) and as composable fallback.
 */

import type {
  TranslationPreset,
  TransformationPreset,
  LLMPromptPreset,
  PresetsSettings,
} from '@/types/common'
import { getDefaultModel } from '@/config/predefinedModels'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate the default keyboard shortcut for a given preset index.
 * - Preset 1 → Ctrl+Alt+T
 * - Presets 2-9 → Ctrl+Alt+{index}
 * - Preset 10+ → '' (Pro users assign manually)
 */
function generateDefaultShortcut(index: number): string {
  if (index === 1) return 'Alt+T'
  if (index >= 2 && index <= 9) return `Ctrl+Alt+${index}`
  return ''
}

// ---------------------------------------------------------------------------
// Onboarding preset definitions
// ---------------------------------------------------------------------------

/**
 * Build the three onboarding presets and return a ready-to-store PresetsSettings.
 * Each preset showcases one mode available in the extension.
 */
export function createOnboardingPresetsSettings(): PresetsSettings {
  // Preset 1 — Translate any language → English (works out of the box with Google)
  const translatePreset: TranslationPreset = {
    id: generateUUID(),
    name: 'Translate to English',
    keyboardShortcut: generateDefaultShortcut(1),
    createdAt: Date.now(),
    type: 'translation',
    sourceLang: 'auto',
    targetLang: 'en',
  }

  // Preset 2 — Flip text upside-down, demonstrates the Transformer mode
  const upsideDownPreset: TransformationPreset = {
    id: generateUUID(),
    name: 'Upside Down Text',
    keyboardShortcut: generateDefaultShortcut(2),
    createdAt: Date.now(),
    type: 'transformation',
    transformationStyle: 'upside-down',
    exampleText: 'Hello World',
  }

  // Preset 3 — LinkedIn post enhancer, demonstrates the LLM Prompt mode.
  // Requires a provider API key; shown as a ready-to-use AI preset example.
  const linkedinPreset: LLMPromptPreset = {
    id: generateUUID(),
    name: 'LinkedIn Post Enhancer',
    keyboardShortcut: generateDefaultShortcut(3),
    createdAt: Date.now(),
    type: 'llm-prompt',
    prompt: `You are an expert LinkedIn content creator. Transform the following text into an engaging, professional LinkedIn post.

Requirements:
- Start with a compelling hook that grabs attention in the first line
- Use short paragraphs (1-3 sentences) for mobile readability
- Add 3-5 relevant emojis placed naturally (not at the end of every line)
- Close with a thought-provoking question or a clear call to action
- Keep a professional yet authentic, human tone
- Optimize for LinkedIn's algorithm (avoid external links in the post body)

Text to transform:
{{input}}

Output only the final LinkedIn post, with no explanation or preamble.`,
    llmProvider: 'gemini',
    llmModel: getDefaultModel('gemini'),
  }

  return {
    presets: [translatePreset, upsideDownPreset, linkedinPreset],
    activePresetId: translatePreset.id,
    provider: 'google',
    pinnedPresetId: translatePreset.id, // Translation preset pinned for right-click menu
  }
}
