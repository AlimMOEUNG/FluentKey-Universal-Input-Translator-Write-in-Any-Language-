<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="space-y-2">
    <!-- Global provider selector -->
    <div>
      <label class="block text-[10px] font-semibold mb-1 text-gray-700 dark:text-gray-300">
        {{ t('providerLabel') }}
      </label>
      <select
        v-model="presetsSettings.provider"
        @change="onProviderChange"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option
          v-for="provider in AVAILABLE_PROVIDERS"
          :key="provider.value"
          :value="provider.value"
        >
          {{ provider.label }}
        </option>
      </select>
    </div>

    <!-- DeepL: API key only -->
    <div v-if="presetsSettings.provider === 'deepl'" class="space-y-1">
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('apiKeyLabelDeepL') }}
      </label>
      <input
        type="password"
        v-model="providerConfigs.deepl.apiKey"
        :placeholder="t('apiKeyPlaceholder')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <ApiKeyCta />
      <ValidationButton
        :disabled="!providerConfigs.deepl.apiKey"
        :status="validationStatus.deepl"
        @validate="validateProviderConfig('deepl')"
      />
      <ValidationMessage :message="validationMessage.deepl" :status="validationStatus.deepl" />
    </div>

    <!-- Gemini: API key + model -->
    <div v-if="presetsSettings.provider === 'gemini'" class="space-y-1">
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('apiKeyLabelGemini') }}
      </label>
      <input
        type="password"
        v-model="providerConfigs.gemini.apiKey"
        :placeholder="t('apiKeyPlaceholder')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <ApiKeyCta />
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelModel') }}
      </label>
      <select
        v-model="providerConfigs.gemini.model"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option v-for="model in PREDEFINED_MODELS.gemini" :key="model.value" :value="model.value">
          {{ model.isCustom ? t('customModel') : model.label }}
        </option>
      </select>
      <input
        v-if="isCustomModel(providerConfigs.gemini.model)"
        type="text"
        v-model="providerConfigs.gemini.customModel"
        :placeholder="t('placeholderCustomModel')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
      />
      <ValidationButton
        :disabled="!providerConfigs.gemini.apiKey"
        :status="validationStatus.gemini"
        @validate="validateProviderConfig('gemini')"
      />
      <ValidationMessage :message="validationMessage.gemini" :status="validationStatus.gemini" />
    </div>

    <!-- ChatGPT: API key + model -->
    <div v-if="presetsSettings.provider === 'chatgpt'" class="space-y-1">
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('apiKeyLabelOpenAI') }}
      </label>
      <input
        type="password"
        v-model="providerConfigs.chatgpt.apiKey"
        :placeholder="t('apiKeyPlaceholder')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <ApiKeyCta />
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelModel') }}
      </label>
      <select
        v-model="providerConfigs.chatgpt.model"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option v-for="model in PREDEFINED_MODELS.chatgpt" :key="model.value" :value="model.value">
          {{ model.isCustom ? t('customModel') : model.label }}
        </option>
      </select>
      <input
        v-if="isCustomModel(providerConfigs.chatgpt.model)"
        type="text"
        v-model="providerConfigs.chatgpt.customModel"
        :placeholder="t('placeholderCustomModel')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
      />
      <ValidationButton
        :disabled="!providerConfigs.chatgpt.apiKey"
        :status="validationStatus.chatgpt"
        @validate="validateProviderConfig('chatgpt')"
      />
      <ValidationMessage :message="validationMessage.chatgpt" :status="validationStatus.chatgpt" />
    </div>

    <!-- Groq: API key + model -->
    <div v-if="presetsSettings.provider === 'groq'" class="space-y-1">
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('apiKeyLabelGroq') }}
      </label>
      <input
        type="password"
        v-model="providerConfigs.groq.apiKey"
        :placeholder="t('apiKeyPlaceholder')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <ApiKeyCta />
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelModel') }}
      </label>
      <select
        v-model="providerConfigs.groq.model"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option v-for="model in PREDEFINED_MODELS.groq" :key="model.value" :value="model.value">
          {{ model.isCustom ? t('customModel') : model.label }}
        </option>
      </select>
      <input
        v-if="isCustomModel(providerConfigs.groq.model)"
        type="text"
        v-model="providerConfigs.groq.customModel"
        :placeholder="t('placeholderCustomModel')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
      />
      <ValidationButton
        :disabled="!providerConfigs.groq.apiKey"
        :status="validationStatus.groq"
        @validate="validateProviderConfig('groq')"
      />
      <ValidationMessage :message="validationMessage.groq" :status="validationStatus.groq" />
    </div>

    <!-- Ollama: base URL + dynamic model list -->
    <div v-if="presetsSettings.provider === 'ollama'" class="space-y-1">
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelBaseUrl') }}
      </label>
      <div class="flex gap-1">
        <input
          type="text"
          v-model="providerConfigs.ollama.baseUrl"
          :placeholder="t('placeholderBaseUrl')"
          class="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          @blur="fetchOllamaModels"
        />
        <!-- Refresh button for dynamic model discovery -->
        <button
          @click="fetchOllamaModels"
          :disabled="!providerConfigs.ollama.baseUrl || ollamaModelsLoading"
          class="px-2 py-1 text-xs rounded transition-colors"
          :class="
            !providerConfigs.ollama.baseUrl || ollamaModelsLoading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          "
          title="Refresh available models"
        >
          {{ ollamaModelsLoading ? '...' : '↻' }}
        </button>
      </div>

      <!-- Model discovery status messages -->
      <p v-if="ollamaModelsLoading" class="text-[10px] text-blue-600 dark:text-blue-400">
        ⏳ Fetching available models...
      </p>
      <p
        v-if="ollamaModelsError && !ollamaModelsLoading"
        class="text-[10px] text-red-600 dark:text-red-400"
      >
        ❌ {{ ollamaModelsError }}
      </p>
      <p
        v-if="ollamaModels.length > 0 && !ollamaModelsLoading"
        class="text-[10px] text-green-600 dark:text-green-400"
      >
        ✅ Found {{ ollamaModels.length }} local model(s)
      </p>
      <p
        v-if="!ollamaModelsLoading && !ollamaModelsError && ollamaModels.length === 0"
        class="text-[10px] text-gray-500 dark:text-gray-400"
      >
        💡 {{ t('ollamaHint') }}
      </p>

      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelModel') }}
      </label>
      <select
        v-model="providerConfigs.ollama.model"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option v-for="model in ollamaModelOptions" :key="model.value" :value="model.value">
          {{ model.value === 'custom' ? t('customModel') : model.label }}
        </option>
      </select>
      <input
        v-if="isCustomModel(providerConfigs.ollama.model)"
        type="text"
        v-model="providerConfigs.ollama.customModel"
        :placeholder="t('placeholderCustomModel')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
      />
      <ValidationButton
        :disabled="!providerConfigs.ollama.model"
        :status="validationStatus.ollama"
        @validate="validateProviderConfig('ollama')"
      />
      <ValidationMessage :message="validationMessage.ollama" :status="validationStatus.ollama" />
    </div>

    <!-- OpenRouter: API key + model -->
    <div v-if="presetsSettings.provider === 'openrouter'" class="space-y-1">
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('apiKeyLabelOpenRouter') }}
      </label>
      <input
        type="password"
        v-model="providerConfigs.openrouter.apiKey"
        :placeholder="t('apiKeyPlaceholder')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <ApiKeyCta />
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelModel') }}
      </label>
      <select
        v-model="providerConfigs.openrouter.model"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option
          v-for="model in PREDEFINED_MODELS.openrouter"
          :key="model.value"
          :value="model.value"
        >
          {{ model.isCustom ? t('customModel') : model.label }}
        </option>
      </select>
      <input
        v-if="isCustomModel(providerConfigs.openrouter.model)"
        type="text"
        v-model="providerConfigs.openrouter.customModel"
        :placeholder="t('placeholderCustomModel')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
      />
      <ValidationButton
        :disabled="!providerConfigs.openrouter.apiKey"
        :status="validationStatus.openrouter"
        @validate="validateProviderConfig('openrouter')"
      />
      <ValidationMessage
        :message="validationMessage.openrouter"
        :status="validationStatus.openrouter"
      />
    </div>

    <!-- Custom OpenAI-compatible endpoint -->
    <div v-if="presetsSettings.provider === 'custom'" class="space-y-1">
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelBaseUrl') }}
      </label>
      <input
        type="text"
        v-model="providerConfigs.custom.baseUrl"
        :placeholder="t('placeholderBaseUrl')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelApiKeyOptional') }}
      </label>
      <input
        type="password"
        v-model="providerConfigs.custom.apiKey"
        :placeholder="t('placeholderOptional')"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <ApiKeyCta />
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelModel') }}
      </label>
      <input
        type="text"
        v-model="providerConfigs.custom.model"
        placeholder="model-name"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <ValidationButton
        :disabled="!providerConfigs.custom.baseUrl || !providerConfigs.custom.model"
        :status="validationStatus.custom"
        @validate="validateProviderConfig('custom')"
      />
      <ValidationMessage :message="validationMessage.custom" :status="validationStatus.custom" />
    </div>

    <!-- Word selection modifier selector (global shortcut setting) -->
    <div class="border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
      <div class="flex items-center gap-1 mb-1 relative group">
        <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
          {{ t('selectionModifierLabel') }}
        </label>
        <!-- Info tooltip explaining the word selection shortcut -->
        <Info :size="13" class="text-gray-400 dark:text-gray-500 cursor-help" />
        <div
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 w-64 pointer-events-none"
        >
          <div
            class="bg-gray-900 dark:bg-gray-700 text-white text-[10px] p-2 rounded shadow-lg leading-relaxed text-center"
          >
            {{ t('selectionModifierHelp') }}
          </div>
        </div>
      </div>
      <select
        :value="selectionModifier"
        @change="
          selectionModifier = ($event.target as HTMLSelectElement).value as SelectionModifier
        "
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option v-for="mod in SELECTION_MODIFIERS" :key="mod.value" :value="mod.value">
          {{ mod.label }}
        </option>
      </select>
      <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-0.5">
        <span class="font-medium text-gray-600 dark:text-gray-400">{{ selectionModifier }}</span>
        <span class="text-base leading-none">+←</span>
        <span class="mx-0.5">/</span>
        <span class="font-medium text-gray-600 dark:text-gray-400">{{ selectionModifier }}</span>
        <span class="text-base leading-none">+→</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineComponent, h } from 'vue'
import { Info } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { useSettings } from '@/composables/useSettings'
import { usePresetsSettings } from '@/composables/usePresetsSettings'
import { PREDEFINED_MODELS, isCustomModel } from '@/config/predefinedModels'
import { AVAILABLE_PROVIDERS } from '@/config/providers'
import { validateProviderCredentials } from '@/utils/providerValidation'
import type { SelectionModifier } from '@/types/common'

const { t } = useI18nWrapper()
const { providerConfigs, providerConfigsLoading } = useSettings()
const { presetsSettings } = usePresetsSettings()

// Available modifier keys for word selection shortcut
const SELECTION_MODIFIERS: Array<{ value: SelectionModifier; label: string }> = [
  { value: 'Alt', label: 'Alt' },
  { value: 'Ctrl', label: 'Ctrl' },
  { value: 'Shift', label: 'Shift' },
  { value: 'Meta', label: 'Meta (⌘/Win)' },
]

// Computed with 'Alt' as default when selectionModifier is undefined
const selectionModifier = computed<SelectionModifier>({
  get: () => presetsSettings.value.selectionModifier ?? 'Alt',
  set: (val) => {
    presetsSettings.value.selectionModifier = val
  },
})

// --- Validation state ---

type ValidationState = 'idle' | 'loading' | 'success' | 'error'

const validationStatus = ref<Record<string, ValidationState>>({
  deepl: 'idle',
  gemini: 'idle',
  chatgpt: 'idle',
  groq: 'idle',
  ollama: 'idle',
  openrouter: 'idle',
  custom: 'idle',
})

const validationMessage = ref<Record<string, string>>({
  deepl: '',
  gemini: '',
  chatgpt: '',
  groq: '',
  ollama: '',
  openrouter: '',
  custom: '',
})

// --- Ollama dynamic model discovery ---

const ollamaModels = ref<Array<{ value: string; label: string }>>([])
const ollamaModelsLoading = ref(false)
const ollamaModelsError = ref('')

// Combines dynamically fetched models with the static "Custom Model" fallback
const ollamaModelOptions = computed(() => {
  if (ollamaModels.value.length > 0) {
    return [...ollamaModels.value, { value: 'custom', label: 'Custom Model' }]
  }
  return [{ value: 'custom', label: 'Custom Model' }]
})

// --- Inline sub-components to avoid extra files for simple UI patterns ---

// Small CTA link displayed below every API key field — opens the subscription interest form
const ApiKeyCta = defineComponent({
  setup() {
    const { t } = useI18nWrapper()
    return () =>
      h(
        'a',
        {
          href: 'https://tally.so/r/9qDkWK',
          target: '_blank',
          rel: 'noopener noreferrer',
          class:
            'block text-[10px] text-blue-500 dark:text-blue-400 hover:underline cursor-pointer mt-0.5',
        },
        t('apiKeySubscriptionCta')
      )
  },
})

// Shared validate button used by every provider section
const ValidationButton = defineComponent({
  props: {
    disabled: { type: Boolean, default: false },
    status: { type: String as () => ValidationState, default: 'idle' },
  },
  emits: ['validate'],
  setup(props, { emit }) {
    const { t } = useI18nWrapper()
    return () => {
      const isDisabled = props.disabled || props.status === 'loading'
      return h(
        'button',
        {
          onClick: () => emit('validate'),
          disabled: isDisabled,
          class: [
            'w-full px-2 py-1.5 text-xs rounded transition-colors',
            isDisabled
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          ],
        },
        props.status === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate')
      )
    }
  },
})

// Shared validation feedback message
const ValidationMessage = defineComponent({
  props: {
    message: { type: String, default: '' },
    status: { type: String as () => ValidationState, default: 'idle' },
  },
  setup(props) {
    return () => {
      if (!props.message) return null
      return h(
        'p',
        {
          class: ['text-[10px]', props.status === 'success' ? 'text-green-600' : 'text-red-600'],
        },
        props.message
      )
    }
  },
})

// --- Provider validation ---
// Delegates to the shared validateProviderCredentials utility (PROXY_FETCH under the hood)

async function validateProviderConfig(provider: string) {
  validationStatus.value[provider] = 'loading'
  validationMessage.value[provider] = ''

  try {
    const cfg = providerConfigs.value[provider as keyof typeof providerConfigs.value] as {
      apiKey?: string
      baseUrl?: string
    }
    const result = await validateProviderCredentials(
      provider,
      cfg?.apiKey ?? '',
      cfg?.baseUrl
    )

    if (result.success) {
      validationStatus.value[provider] = 'success'
      validationMessage.value[provider] = `✓ ${t('apiKeyValid')}`
    } else {
      validationStatus.value[provider] = 'error'
      validationMessage.value[provider] = `✗ ${result.error}`
    }
  } catch (err) {
    validationStatus.value[provider] = 'error'
    validationMessage.value[provider] = `✗ ${err instanceof Error ? err.message : t('apiKeyRequired')}`
  }
}

// --- Ollama model fetching ---

/**
 * Fetch available models from a running Ollama instance.
 * Falls back to an empty list on error so the user can still type a custom model.
 */
async function fetchOllamaModels() {
  const baseUrl = providerConfigs.value.ollama.baseUrl

  if (!baseUrl) {
    ollamaModelsError.value = 'Please configure Ollama Base URL first'
    return
  }

  ollamaModelsLoading.value = true
  ollamaModelsError.value = ''

  try {
    // Strip any trailing /v1 — the tags endpoint lives on the root URL
    const cleanUrl = baseUrl.replace(/\/v1\/?$/, '')
    const response = await chrome.runtime.sendMessage({
      type: 'PROXY_FETCH',
      url: `${cleanUrl}/api/tags`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.success && response.data?.models) {
      ollamaModels.value = response.data.models.map((model: { name: string }) => ({
        value: model.name,
        label: model.name,
      }))

      // Reset model selection if the current value is no longer in the fetched list
      if (
        providerConfigs.value.ollama.model &&
        providerConfigs.value.ollama.model !== 'custom' &&
        !ollamaModels.value.some((m) => m.value === providerConfigs.value.ollama.model)
      ) {
        providerConfigs.value.ollama.model = ollamaModels.value[0]?.value || ''
      }
    } else {
      ollamaModelsError.value = response.error || 'Failed to fetch models'
    }
  } catch (error) {
    ollamaModelsError.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    ollamaModelsLoading.value = false
  }
}

// --- Provider change handler ---

function onProviderChange() {
  checkProviderConfiguration()
  // Auto-trigger model discovery when switching to Ollama with a URL already set
  if (presetsSettings.value.provider === 'ollama' && providerConfigs.value.ollama.baseUrl) {
    fetchOllamaModels()
  }
}

/**
 * Reset validation state and highlight missing required fields for the
 * currently selected provider. Called on mount and on provider change.
 */
function checkProviderConfiguration() {
  const provider = presetsSettings.value.provider

  // Clear all previous messages
  Object.keys(validationMessage.value).forEach((key) => {
    validationMessage.value[key] = ''
    validationStatus.value[key] = 'idle'
  })

  // google and builtin providers need no credentials
  if (provider === 'google' || provider === 'builtin') return

  switch (provider) {
    case 'deepl':
      if (!providerConfigs.value.deepl.apiKey) {
        validationStatus.value.deepl = 'error'
        validationMessage.value.deepl = `✗ ${t('apiKeyRequired')}`
      }
      break
    case 'gemini':
      if (!providerConfigs.value.gemini.apiKey) {
        validationStatus.value.gemini = 'error'
        validationMessage.value.gemini = `✗ ${t('apiKeyRequired')}`
      }
      break
    case 'chatgpt':
      if (!providerConfigs.value.chatgpt.apiKey) {
        validationStatus.value.chatgpt = 'error'
        validationMessage.value.chatgpt = `✗ ${t('apiKeyRequired')}`
      }
      break
    case 'groq':
      if (!providerConfigs.value.groq.apiKey) {
        validationStatus.value.groq = 'error'
        validationMessage.value.groq = `✗ ${t('apiKeyRequired')}`
      }
      break
    case 'ollama':
      if (!providerConfigs.value.ollama.model) {
        validationStatus.value.ollama = 'error'
        validationMessage.value.ollama = `✗ ${t('modelRequired')}`
      } else if (!providerConfigs.value.ollama.baseUrl) {
        validationStatus.value.ollama = 'error'
        validationMessage.value.ollama = `✗ ${t('baseUrlRequired')}`
      }
      break
    case 'openrouter':
      if (!providerConfigs.value.openrouter.apiKey) {
        validationStatus.value.openrouter = 'error'
        validationMessage.value.openrouter = `✗ ${t('apiKeyRequired')}`
      }
      break
    case 'custom':
      if (!providerConfigs.value.custom.baseUrl) {
        validationStatus.value.custom = 'error'
        validationMessage.value.custom = `✗ ${t('baseUrlRequired')}`
      } else if (!providerConfigs.value.custom.model) {
        validationStatus.value.custom = 'error'
        validationMessage.value.custom = `✗ ${t('modelRequired')}`
      }
      break
  }
}

// --- Lifecycle ---

// Run checkProviderConfiguration() only after providerConfigs has loaded from storage.
// onMounted fires before the async storage read completes, so checking there would
// always see empty defaults and incorrectly show "API key required".
watch(providerConfigsLoading, (loading) => {
  if (!loading) {
    checkProviderConfiguration()
    if (presetsSettings.value.provider === 'ollama' && providerConfigs.value.ollama.baseUrl) {
      fetchOllamaModels()
    }
  }
}, { immediate: true })
</script>
