/**
 * Predefined models configuration for each translation provider
 * Each provider has a list of common models + a 'custom' option
 */

export interface ModelOption {
  value: string
  label: string
  isCustom?: boolean
}

export const PREDEFINED_MODELS = {
  gemini: [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Recommended)' },
    { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash-8B' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-pro', label: 'Gemini Pro (Legacy)' },
    { value: 'custom', label: 'Custom Model', isCustom: true },
  ] as ModelOption[],

  chatgpt: [
    { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'o1-preview', label: 'o1 Preview' },
    { value: 'o1-mini', label: 'o1 Mini' },
    { value: 'custom', label: 'Custom Model', isCustom: true },
  ] as ModelOption[],

  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Recommended)' },
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
    { value: 'llama3-70b-8192', label: 'Llama 3 70B' },
    { value: 'llama3-8b-8192', label: 'Llama 3 8B' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    { value: 'custom', label: 'Custom Model', isCustom: true },
  ] as ModelOption[],

  openrouter: [
    {
      value: 'meta-llama/llama-3.3-70b-instruct',
      label: 'Meta Llama 3.3 70B (Recommended)',
    },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
    { value: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
    { value: 'google/gemini-2.0-flash-exp', label: 'Google Gemini 2.0 Flash' },
    { value: 'google/gemini-pro-1.5', label: 'Google Gemini 1.5 Pro' },
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Meta Llama 3.1 70B' },
    { value: 'mistralai/mixtral-8x7b-instruct', label: 'Mixtral 8x7B' },
    { value: 'custom', label: 'Custom Model', isCustom: true },
  ] as ModelOption[],

  // Ollama models are fetched dynamically from local instance
  // This is just a fallback if fetch fails
  ollama: [{ value: 'custom', label: 'Custom Model', isCustom: true }] as ModelOption[],
} as const

export type PredefinedModelProvider = keyof typeof PREDEFINED_MODELS

/**
 * Get predefined models for a specific provider
 */
export function getPredefinedModels(provider: PredefinedModelProvider): ModelOption[] {
  return PREDEFINED_MODELS[provider] || []
}

/**
 * Check if a model value is the custom option
 */
export function isCustomModel(modelValue: string): boolean {
  return modelValue === 'custom'
}

/**
 * Get the default model for a provider (first non-custom option)
 */
export function getDefaultModel(provider: PredefinedModelProvider): string {
  const models = PREDEFINED_MODELS[provider]
  return models.find((m) => !m.isCustom)?.value || models[0]?.value || ''
}

/**
 * Get the effective model to use based on selection and custom value
 * If model is 'custom', returns customModel, otherwise returns model
 */
export function getEffectiveModel(model: string, customModel?: string): string {
  return isCustomModel(model) && customModel ? customModel : model
}
