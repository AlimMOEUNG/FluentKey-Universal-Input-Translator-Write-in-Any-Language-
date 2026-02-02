<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="w-full max-w-[400px] min-w-[360px] h-auto flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-2.5 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
    >
      <h1 class="text-xs font-bold text-gray-800 dark:text-gray-200">
        {{ t('appTitle') }}
      </h1>

      <div class="flex items-center gap-2">
        <!-- Language Selector -->
        <select
          v-model="uiLocale"
          class="px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option v-for="option in availableLanguages" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <!-- Theme Toggle -->
        <button
          @click="cycleTheme"
          class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :title="t('themeToggle')"
        >
          <component :is="themeIcon" :size="16" />
        </button>
      </div>
    </div>

    <!-- Main Navigation Tabs -->
    <div class="main-nav-container">
      <button
        @click="currentView = 'presets'"
        :class="['main-nav-tab', { active: currentView === 'presets' }]"
      >
        Presets
      </button>
      <button
        @click="currentView = 'provider'"
        :class="['main-nav-tab', { active: currentView === 'provider' }]"
      >
        Provider
      </button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col p-2.5">
      <!-- Provider View -->
      <div v-if="currentView === 'provider'" class="space-y-2">
        <div>
          <label class="block text-[10px] font-semibold mb-1 text-gray-700 dark:text-gray-300">
            {{ t('providerLabel') }}
          </label>
          <select
            v-model="presetsSettings.provider"
            @change="onProviderChange"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="google">Google Translate (Free)</option>
            <option value="builtin">Chrome Built-in AI (Free)</option>
            <option value="deepl">DeepL API</option>
            <option value="gemini">Google Gemini API</option>
            <option value="chatgpt">ChatGPT (OpenAI)</option>
            <option value="groq">Groq (Free & Fast)</option>
            <option value="ollama">Ollama (Local)</option>
            <option value="openrouter">OpenRouter</option>
            <option value="custom">Custom OpenAI-compatible</option>
          </select>
        </div>

        <!-- DeepL API Key -->
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
          <button
            @click="validateProviderConfig('deepl')"
            :disabled="!providerConfigs.deepl.apiKey || validationStatus.deepl === 'loading'"
            class="w-full px-2 py-1.5 text-xs rounded transition-colors"
            :class="
              !providerConfigs.deepl.apiKey || validationStatus.deepl === 'loading'
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            {{ validationStatus.deepl === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
          </button>
          <p
            v-if="validationMessage.deepl"
            class="text-[10px]"
            :class="{
              'text-green-600': validationStatus.deepl === 'success',
              'text-red-600': validationStatus.deepl === 'error',
            }"
          >
            {{ validationMessage.deepl }}
          </p>
        </div>

        <!-- Gemini Configuration -->
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
          <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
            {{ t('labelModel') }}
          </label>
          <select
            v-model="providerConfigs.gemini.model"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option v-for="model in PREDEFINED_MODELS.gemini" :key="model.value" :value="model.value">
              {{ model.label }}
            </option>
          </select>
          <input
            v-if="isCustomModel(providerConfigs.gemini.model)"
            type="text"
            v-model="providerConfigs.gemini.customModel"
            :placeholder="t('placeholderCustomModel')"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
          />
          <button
            @click="validateProviderConfig('gemini')"
            :disabled="!providerConfigs.gemini.apiKey || validationStatus.gemini === 'loading'"
            class="w-full px-2 py-1.5 text-xs rounded transition-colors"
            :class="
              !providerConfigs.gemini.apiKey || validationStatus.gemini === 'loading'
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            {{ validationStatus.gemini === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
          </button>
          <p
            v-if="validationMessage.gemini"
            class="text-[10px]"
            :class="{
              'text-green-600': validationStatus.gemini === 'success',
              'text-red-600': validationStatus.gemini === 'error',
            }"
          >
            {{ validationMessage.gemini }}
          </p>
        </div>

        <!-- ChatGPT Configuration -->
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
          <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
            {{ t('labelModel') }}
          </label>
          <select
            v-model="providerConfigs.chatgpt.model"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option v-for="model in PREDEFINED_MODELS.chatgpt" :key="model.value" :value="model.value">
              {{ model.label }}
            </option>
          </select>
          <input
            v-if="isCustomModel(providerConfigs.chatgpt.model)"
            type="text"
            v-model="providerConfigs.chatgpt.customModel"
            :placeholder="t('placeholderCustomModel')"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
          />
          <button
            @click="validateProviderConfig('chatgpt')"
            :disabled="!providerConfigs.chatgpt.apiKey || validationStatus.chatgpt === 'loading'"
            class="w-full px-2 py-1.5 text-xs rounded transition-colors"
            :class="
              !providerConfigs.chatgpt.apiKey || validationStatus.chatgpt === 'loading'
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            {{ validationStatus.chatgpt === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
          </button>
          <p
            v-if="validationMessage.chatgpt"
            class="text-[10px]"
            :class="{
              'text-green-600': validationStatus.chatgpt === 'success',
              'text-red-600': validationStatus.chatgpt === 'error',
            }"
          >
            {{ validationMessage.chatgpt }}
          </p>
        </div>

        <!-- Groq Configuration -->
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
          <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
            {{ t('labelModel') }}
          </label>
          <select
            v-model="providerConfigs.groq.model"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option v-for="model in PREDEFINED_MODELS.groq" :key="model.value" :value="model.value">
              {{ model.label }}
            </option>
          </select>
          <input
            v-if="isCustomModel(providerConfigs.groq.model)"
            type="text"
            v-model="providerConfigs.groq.customModel"
            :placeholder="t('placeholderCustomModel')"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
          />
          <button
            @click="validateProviderConfig('groq')"
            :disabled="!providerConfigs.groq.apiKey || validationStatus.groq === 'loading'"
            class="w-full px-2 py-1.5 text-xs rounded transition-colors"
            :class="
              !providerConfigs.groq.apiKey || validationStatus.groq === 'loading'
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            {{ validationStatus.groq === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
          </button>
          <p
            v-if="validationMessage.groq"
            class="text-[10px]"
            :class="{
              'text-green-600': validationStatus.groq === 'success',
              'text-red-600': validationStatus.groq === 'error',
            }"
          >
            {{ validationMessage.groq }}
          </p>
        </div>

        <!-- Ollama Configuration -->
        <div v-if="presetsSettings.provider === 'ollama'" class="space-y-1">
          <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
            {{ t('labelBaseUrl') }}
          </label>
          <input
            type="text"
            v-model="providerConfigs.ollama.baseUrl"
            :placeholder="t('placeholderBaseUrl')"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
            {{ t('labelModel') }}
          </label>
          <select
            v-model="providerConfigs.ollama.model"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option v-for="model in PREDEFINED_MODELS.ollama" :key="model.value" :value="model.value">
              {{ model.label }}
            </option>
          </select>
          <input
            v-if="isCustomModel(providerConfigs.ollama.model)"
            type="text"
            v-model="providerConfigs.ollama.customModel"
            :placeholder="t('placeholderCustomModel')"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
          />
          <button
            @click="validateProviderConfig('ollama')"
            :disabled="!providerConfigs.ollama.model || validationStatus.ollama === 'loading'"
            class="w-full px-2 py-1.5 text-xs rounded transition-colors"
            :class="
              !providerConfigs.ollama.model || validationStatus.ollama === 'loading'
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            {{ validationStatus.ollama === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
          </button>
          <p
            v-if="validationMessage.ollama"
            class="text-[10px]"
            :class="{
              'text-green-600': validationStatus.ollama === 'success',
              'text-red-600': validationStatus.ollama === 'error',
            }"
          >
            {{ validationMessage.ollama }}
          </p>
        </div>

        <!-- OpenRouter Configuration -->
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
          <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
            {{ t('labelModel') }}
          </label>
          <select
            v-model="providerConfigs.openrouter.model"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option v-for="model in PREDEFINED_MODELS.openrouter" :key="model.value" :value="model.value">
              {{ model.label }}
            </option>
          </select>
          <input
            v-if="isCustomModel(providerConfigs.openrouter.model)"
            type="text"
            v-model="providerConfigs.openrouter.customModel"
            :placeholder="t('placeholderCustomModel')"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
          />
          <button
            @click="validateProviderConfig('openrouter')"
            :disabled="
              !providerConfigs.openrouter.apiKey || validationStatus.openrouter === 'loading'
            "
            class="w-full px-2 py-1.5 text-xs rounded transition-colors"
            :class="
              !providerConfigs.openrouter.apiKey || validationStatus.openrouter === 'loading'
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            {{
              validationStatus.openrouter === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate')
            }}
          </button>
          <p
            v-if="validationMessage.openrouter"
            class="text-[10px]"
            :class="{
              'text-green-600': validationStatus.openrouter === 'success',
              'text-red-600': validationStatus.openrouter === 'error',
            }"
          >
            {{ validationMessage.openrouter }}
          </p>
        </div>

        <!-- Custom OpenAI-compatible Configuration -->
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
          <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
            {{ t('labelModel') }}
          </label>
          <input
            type="text"
            v-model="providerConfigs.custom.model"
            placeholder="model-name"
            class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            @click="validateProviderConfig('custom')"
            :disabled="
              !providerConfigs.custom.baseUrl ||
              !providerConfigs.custom.model ||
              validationStatus.custom === 'loading'
            "
            class="w-full px-2 py-1.5 text-xs rounded transition-colors"
            :class="
              !providerConfigs.custom.baseUrl ||
              !providerConfigs.custom.model ||
              validationStatus.custom === 'loading'
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            {{ validationStatus.custom === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
          </button>
          <p
            v-if="validationMessage.custom"
            class="text-[10px]"
            :class="{
              'text-green-600': validationStatus.custom === 'success',
              'text-red-600': validationStatus.custom === 'error',
            }"
          >
            {{ validationMessage.custom }}
          </p>
        </div>
      </div>

      <!-- Presets View -->
      <div v-else class="space-y-2">
        <!-- Preset Tabs -->
        <div class="preset-tabs-header">
          <button
            v-for="preset in presetsSettings.presets"
            :key="preset.id"
            @click="selectPreset(preset.id)"
            :class="['preset-tab', { active: preset.id === presetsSettings.activePresetId }]"
            :title="`${preset.name}: ${preset.keyboardShortcut}`"
          >
            <span class="preset-tab-name">{{ preset.name }}</span>
          </button>

          <button
            @click="addPreset"
            :disabled="!canAddPreset()"
            class="preset-tab add-tab"
            :class="{ disabled: !canAddPreset() }"
            :title="
              canAddPreset()
                ? t('addPreset')
                : `Maximum ${maxPresets} presets reached`
            "
          >
            +
          </button>
        </div>

        <!-- Preset Editor -->
        <PresetEditor
          v-if="activePreset"
          :preset="activePreset"
          :all-presets="presetsSettings.presets"
          :can-delete="presetsSettings.presets.length > 1"
          @update-preset="updatePreset"
          @delete-preset="deletePreset"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { useThemeMode } from '@/composables/useThemeMode'
import { useSettings } from '@/composables/useSettings'
import { usePresetsSettings } from '@/composables/usePresetsSettings'
import { PREDEFINED_MODELS, isCustomModel, getEffectiveModel } from '@/config/predefinedModels'
import type { SupportedLocale } from '@/core/utils/i18n'
import type { TranslationPreset } from '@/types/common'
import PresetEditor from '@/components/PresetEditor.vue'

// i18n setup
const { t, locale, setLocale } = useI18nWrapper()

// Theme management
const { themeMode, cycleTheme } = useThemeMode()

// Presets settings management
const {
  presetsSettings,
  addPreset: addPresetHelper,
  updatePreset: updatePresetHelper,
  deletePreset: deletePresetHelper,
  setActivePreset,
  getActivePreset,
  isLoading: _isLoadingPresets,
  canAddPreset,
  maxPresets,
} = usePresetsSettings()

// Provider configs (still uses old useSettings for provider keys)
const { providerConfigs } = useSettings()

// Current view state
const currentView = ref<'presets' | 'provider'>('presets')

// Language selector
const availableLanguages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
]

const uiLocale = computed<SupportedLocale>({
  get: () => locale.value,
  set: (value) => {
    setLocale(value)
  },
})

// Theme icon computed
const themeIcon = computed(() => {
  switch (themeMode.value) {
    case 'light':
      return Sun
    case 'dark':
      return Moon
    default:
      return Monitor
  }
})

// Validation status
const validationStatus = ref({
  deepl: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  gemini: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  chatgpt: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  groq: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  ollama: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  openrouter: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  custom: 'idle' as 'idle' | 'loading' | 'success' | 'error',
})

const validationMessage = ref({
  deepl: '',
  gemini: '',
  chatgpt: '',
  groq: '',
  ollama: '',
  openrouter: '',
  custom: '',
})

// Get active preset
const activePreset = computed(() => {
  return getActivePreset()
})

// Preset management functions
function selectPreset(id: string) {
  setActivePreset(id)
}

function addPreset() {
  if (!canAddPreset()) {
    alert(`Maximum limit of ${maxPresets} presets reached`)
    return
  }
  const newPreset = addPresetHelper()
  if (!newPreset) {
    alert(`Maximum limit of ${maxPresets} presets reached`)
  }
}

function updatePreset(updatedPreset: TranslationPreset) {
  updatePresetHelper(updatedPreset)
}

function deletePreset(id: string) {
  if (presetsSettings.value.presets.length <= 1) {
    alert(t('cannotDeleteLastPreset'))
    return
  }
  deletePresetHelper(id)
}

// Load settings on mount
onMounted(() => {
  // Settings are automatically loaded by useStorageState
  // Check if current provider configuration is complete
  checkProviderConfiguration()
})

async function validateProviderConfig(provider: string) {
  // Reset validation state
  validationStatus.value[provider as keyof typeof validationStatus.value] = 'loading'
  validationMessage.value[provider as keyof typeof validationMessage.value] = ''

  try {
    let response

    switch (provider) {
      case 'deepl':
        if (!providerConfigs.value.deepl.apiKey) return
        response = await chrome.runtime.sendMessage({
          type: 'VALIDATE_DEEPL_KEY',
          apiKey: providerConfigs.value.deepl.apiKey,
        })
        break

      case 'gemini':
        if (!providerConfigs.value.gemini.apiKey) return
        response = await chrome.runtime.sendMessage({
          type: 'VALIDATE_GEMINI_KEY',
          apiKey: providerConfigs.value.gemini.apiKey,
          model: getEffectiveModel(
            providerConfigs.value.gemini.model,
            providerConfigs.value.gemini.customModel
          ),
        })
        break

      case 'chatgpt':
      case 'groq':
      case 'ollama':
      case 'openrouter':
      case 'custom': {
        const config = providerConfigs.value[provider as keyof typeof providerConfigs.value]
        const effectiveModel =
          provider === 'custom'
            ? config.model
            : getEffectiveModel(config.model, config.customModel)
        response = await chrome.runtime.sendMessage({
          type: 'VALIDATE_OPENAI_COMPATIBLE',
          config: {
            providerType: provider,
            ...config,
            model: effectiveModel,
          },
        })
        break
      }

      default:
        throw new Error(`Unknown provider: ${provider}`)
    }

    if (response.success) {
      validationStatus.value[provider as keyof typeof validationStatus.value] = 'success'
      validationMessage.value[provider as keyof typeof validationMessage.value] =
        `✓ ${t('validationSuccess')}`
      // Configuration is automatically saved by useStorageState
    } else {
      validationStatus.value[provider as keyof typeof validationStatus.value] = 'error'
      validationMessage.value[provider as keyof typeof validationMessage.value] =
        `✗ ${response.error}`
    }
  } catch {
    validationStatus.value[provider as keyof typeof validationStatus.value] = 'error'
    validationMessage.value[provider as keyof typeof validationMessage.value] =
      `✗ ${t('validationFailed')}`
  }
}

function onProviderChange() {
  // Settings are automatically saved by useStorageState
  // Check if the selected provider has the required configuration
  checkProviderConfiguration()
}

/**
 * Check if the current provider has the required configuration
 * Display an alert if API key or required fields are missing
 */
function checkProviderConfiguration() {
  const provider = presetsSettings.value.provider

  // Reset all validation messages first
  Object.keys(validationMessage.value).forEach((key) => {
    validationMessage.value[key as keyof typeof validationMessage.value] = ''
    validationStatus.value[key as keyof typeof validationStatus.value] = 'idle'
  })

  // Providers that don't require API keys
  if (provider === 'google' || provider === 'builtin') {
    return
  }

  // Check provider-specific requirements
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
</script>

<style scoped>
/* Main Navigation Tabs */
.main-nav-container {
  display: flex;
  gap: 0;
  border-bottom: 2px solid theme('colors.gray.200');
  background-color: theme('colors.gray.50');
}

:root[data-theme='dark'] .main-nav-container {
  border-bottom-color: theme('colors.gray-700');
  background-color: theme('colors.gray.800');
}

.main-nav-tab {
  flex: 1;
  padding: 0.625rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: transparent;
  color: theme('colors.gray.600');
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

:root[data-theme='dark'] .main-nav-tab {
  color: theme('colors.gray.400');
}

.main-nav-tab:hover {
  background-color: theme('colors.gray.100');
  color: theme('colors.gray.900');
}

:root[data-theme='dark'] .main-nav-tab:hover {
  background-color: theme('colors.gray.700');
  color: theme('colors.gray.100');
}

.main-nav-tab.active {
  background-color: theme('colors.white');
  color: theme('colors.blue.600');
  border-bottom-color: theme('colors.blue.600');
}

:root[data-theme='dark'] .main-nav-tab.active {
  background-color: theme('colors.gray.900');
  color: theme('colors.blue.400');
  border-bottom-color: theme('colors.blue.400');
}

/* Preset Tabs */
.preset-tabs-header {
  display: flex;
  gap: 0.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid theme('colors.gray.200');
  overflow: hidden; /* Prevent scroll */
}

:root[data-theme='dark'] .preset-tabs-header {
  border-bottom-color: theme('colors.gray.700');
}

.preset-tab {
  padding: 0.4rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: 1.5px solid theme('colors.gray.300');
  background-color: theme('colors.white');
  color: theme('colors.gray.700');
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex: 1 1 0; /* Each tab takes equal space */
  min-width: 0; /* Allow shrinking below content size */
  max-width: 120px; /* Max width when few tabs */
}

:root[data-theme='dark'] .preset-tab {
  background-color: theme('colors.gray.800');
  border-color: theme('colors.gray.600');
  color: theme('colors.gray.300');
}

.preset-tab-name {
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%; /* Use all available space in tab */
}

.preset-tab:hover {
  background-color: theme('colors.gray.50');
  border-color: theme('colors.gray.400');
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:root[data-theme='dark'] .preset-tab:hover {
  background-color: theme('colors.gray.700');
  border-color: theme('colors.gray.500');
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.preset-tab.active {
  background-color: theme('colors.blue.600');
  color: theme('colors.white');
  border-color: theme('colors.blue.600');
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

:root[data-theme='dark'] .preset-tab.active {
  background-color: theme('colors.blue.500');
  border-color: theme('colors.blue.500');
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.5);
}

.add-tab {
  background-color: theme('colors.emerald.50');
  color: theme('colors.emerald.600');
  border-color: theme('colors.emerald.300');
  padding: 0.4rem 0.65rem;
  font-size: 0.9rem;
  line-height: 1;
  flex-shrink: 0; /* Don't shrink the + button */
  flex-grow: 0; /* Don't grow the + button */
}

:root[data-theme='dark'] .add-tab {
  background-color: theme('colors.emerald.900');
  color: theme('colors.emerald.400');
  border-color: theme('colors.emerald.700');
}

.add-tab:hover {
  background-color: theme('colors.emerald.100');
  color: theme('colors.emerald.700');
  border-color: theme('colors.emerald.400');
}

:root[data-theme='dark'] .add-tab:hover {
  background-color: theme('colors.emerald.800');
  color: theme('colors.emerald.300');
  border-color: theme('colors.emerald.600');
}

.add-tab.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: theme('colors.gray.100');
  color: theme('colors.gray.400');
  border-color: theme('colors.gray.300');
}

:root[data-theme='dark'] .add-tab.disabled {
  background-color: theme('colors.gray.800');
  color: theme('colors.gray.600');
  border-color: theme('colors.gray.700');
}

.add-tab.disabled:hover {
  background-color: theme('colors.gray.100');
  color: theme('colors.gray.400');
  border-color: theme('colors.gray.300');
  transform: none;
}

:root[data-theme='dark'] .add-tab.disabled:hover {
  background-color: theme('colors.gray.800');
  color: theme('colors.gray.600');
  border-color: theme('colors.gray.700');
}
</style>
