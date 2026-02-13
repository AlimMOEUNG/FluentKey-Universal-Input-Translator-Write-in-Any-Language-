<template>
  <div class="preset-editor space-y-2 relative">
    <!-- Preset Name (no label, just input with save/undo buttons) -->
    <div class="flex gap-1 items-center">
      <input
        v-model="localPreset.name"
        :placeholder="t('presetNamePlaceholder')"
        class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <!-- Save/Undo buttons (only visible when unsaved changes exist) -->
      <template v-if="hasUnsavedChanges">
        <button
          @click="undoChanges"
          class="px-2 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
          :title="t('undoChanges')"
        >
          <RotateCcw :size="12" />
        </button>
        <button
          @click="savePreset"
          class="px-2 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
          :title="t('saveChanges')"
        >
          <Check :size="12" />
        </button>
      </template>
    </div>

    <!-- Mode (always visible, not in accordion) -->
    <div class="flex items-center gap-2 pt-1">
      <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {{ t('presetModeLabel') }}
      </label>
      <select
        :value="localPreset.type"
        @change="
          (e) => {
            const value = (e.target as HTMLSelectElement).value
            if (isValidPresetType(value)) {
              handleModeChange(value)
            }
          }
        "
        class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option v-for="mode in PRESET_MODES" :key="mode.type" :value="mode.type">
          {{ t(mode.i18nKey) }}
        </option>
      </select>
    </div>

    <!-- Settings (all modes visible, no accordion) -->
    <div class="space-y-1.5">
      <!-- Translation Panel -->
      <template v-if="localPreset.type === 'translation'">
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
            {{ t('sourceLanguage') }}
          </label>
          <div class="flex-1">
            <LanguageSelector
              v-model="localPreset.sourceLang"
              :placeholder="t('searchLanguagePlaceholder')"
              input-id="source-language-selector"
              include-auto-detect
            />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
            {{ t('targetLanguage') }}
          </label>
          <div class="flex-1">
            <LanguageSelector
              v-model="localPreset.targetLang"
              :placeholder="t('searchLanguagePlaceholder')"
              input-id="target-language-selector"
            />
          </div>
        </div>

        <!-- Custom Provider (inline, only for translation mode) -->
        <div class="flex items-start gap-2 pt-1">
          <div class="flex items-center gap-2 w-24 shrink-0 pt-1.5">
            <input
              type="checkbox"
              id="useCustomProvider"
              v-model="localPreset.useCustomProvider"
              class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500"
            />
            <label
              for="useCustomProvider"
              class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Custom
            </label>
          </div>
          <div class="flex-1 space-y-1.5" v-if="localPreset.useCustomProvider">
            <!-- Provider selection -->
            <select
              v-model="localPreset.customProvider"
              @change="onCustomProviderChange"
              class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option
                v-for="provider in AVAILABLE_PROVIDERS"
                :key="provider.value"
                :value="provider.value"
              >
                {{ provider.label }}
              </option>
            </select>

            <!-- Generic Provider Configuration (DRY approach) -->
            <template v-if="localPreset.customProvider && currentProviderConfig">
              <!-- Base URL (if required) -->
              <input
                v-if="currentProviderConfig.requiresBaseUrl"
                v-model="presetConfig.baseUrl"
                type="text"
                :placeholder="
                  localPreset.customProvider === 'custom'
                    ? 'Base URL (e.g., http://localhost:1234/v1)'
                    : `Base URL (e.g., ${currentProviderConfig.defaultBaseUrl})`
                "
                class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <!-- API Key (if required) -->
              <input
                v-if="currentProviderConfig.requiresApiKey"
                v-model="presetConfig.apiKey"
                type="password"
                :placeholder="
                  localPreset.customProvider === 'custom'
                    ? 'API Key (optional)'
                    : t('apiKeyPlaceholder')
                "
                class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <!-- Model Dropdown (for LLM providers with predefined models) -->
              <select
                v-if="currentProviderConfig.availableModels.length > 0"
                v-model="presetConfig.model"
                class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option
                  v-for="model in currentProviderConfig.availableModels"
                  :key="model.value"
                  :value="model.value"
                >
                  {{ model.isCustom ? t('customModel') : model.label }}
                </option>
              </select>

              <!-- Custom Model Input (when 'custom' is selected from dropdown) -->
              <input
                v-if="
                  currentProviderConfig.availableModels.length > 0 &&
                  isCustomModel(presetConfig.model || '')
                "
                v-model="presetConfig.customModel"
                :placeholder="t('placeholderCustomModel')"
                class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <!-- Model Input (for custom provider without dropdown) -->
              <input
                v-if="
                  localPreset.customProvider === 'custom' &&
                  currentProviderConfig.availableModels.length === 0
                "
                v-model="presetConfig.model"
                type="text"
                :placeholder="t('placeholderCustomModel')"
                class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </template>
          </div>
        </div>
      </template>

      <!-- Transformation Panel -->
      <template v-else-if="localPreset.type === 'transformation'">
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
            {{ t('transformationStyle') }}
          </label>
          <select
            v-model="localPreset.transformationStyle"
            class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-unicode"
          >
            <option
              v-for="style in transformationStyles"
              :key="style.value"
              :value="style.value"
              class="font-unicode"
            >
              {{ style.label }} - {{ style.example }}
            </option>
          </select>
        </div>
        <!-- Live Preview -->
        <div v-if="localPreset.transformationStyle" class="space-y-1">
          <div class="flex items-center gap-2">
            <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
              {{ t('previewExample') }}
            </label>
            <input
              v-model="customExampleText"
              :placeholder="t('previewPlaceholder')"
              class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div
            class="ml-[7rem] p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 preview-transformed"
          >
            {{ transformedPreview }}
          </div>
        </div>
      </template>

      <!-- Custom Transform Panel -->
      <template v-else-if="localPreset.type === 'custom-transform'">
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
            {{ t('customTransformLabel') }}
          </label>
          <select
            v-model="localPreset.customTransformId"
            class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>{{ t('customTransformPlaceholder') }}</option>
            <option v-for="ct in customTransforms" :key="ct.id" :value="ct.id">
              {{ ct.name }} ({{ Object.keys(ct.charMap).length }} mappings)
            </option>
          </select>
        </div>
        <p
          v-if="customTransforms.length === 0"
          class="text-[10px] text-gray-500 dark:text-gray-400 ml-[7rem]"
        >
          {{ t('customTransformEmpty') }}
        </p>
        <button
          @click="openOptionsPage"
          class="ml-[7rem] px-2 py-1.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {{ t('customTransformOpenOptions') }}
        </button>
        <!-- Live Preview -->
        <div v-if="localPreset.customTransformId && selectedCustomTransform" class="space-y-1">
          <div class="flex items-center gap-2">
            <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
              {{ t('previewExample') }}
            </label>
            <input
              v-model="customExampleText"
              :placeholder="t('previewPlaceholder')"
              class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div
            class="ml-[7rem] p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 preview-transformed"
          >
            {{ customTransformPreview }}
          </div>
        </div>
      </template>

      <!-- LLM Prompt Panel -->
      <template v-else-if="localPreset.type === 'llm-prompt'">
        <div class="flex flex-col gap-1">
          <!-- Label inline with expand button right next to it -->
          <div class="flex items-center gap-1">
            <span class="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
              {{ t('llmPromptLabel') }}
            </span>
            <button
              type="button"
              :title="t('expandPrompt')"
              @click="showPromptModal = true"
              class="flex items-center px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 transition-colors"
            >
              <Maximize2 :size="10" />
            </button>
          </div>
          <!-- Full-width textarea + hint -->
          <textarea
            v-model="localPreset.prompt"
            :placeholder="t('llmPromptPlaceholder')"
            rows="3"
            class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
          <p class="text-[10px] text-gray-500 dark:text-gray-400">
            {{ t('llmPromptHint') }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
            {{ t('llmPromptProviderLabel') }}
          </label>
          <select
            v-model="localPreset.llmProvider"
            @change="onLLMProviderChange"
            class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option v-for="p in LLM_PROVIDERS" :key="p.value" :value="p.value">
              {{ p.label }}
            </option>
          </select>
        </div>
        <div class="flex items-start gap-2">
          <label
            class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0 pt-1.5"
          >
            {{ t('llmPromptModelLabel') }}
          </label>
          <div class="flex-1 space-y-1">
            <!-- Dropdown of predefined models (for providers that have them) -->
            <select
              v-if="llmHasPredefinedModels"
              v-model="llmModelSelection"
              class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option v-for="model in llmAvailableModels" :key="model.value" :value="model.value">
                {{ model.isCustom ? t('customModel') : model.label }}
              </option>
            </select>
            <!-- Free-text input: shown when 'custom' is selected or provider has no predefined list -->
            <input
              v-if="!llmHasPredefinedModels || isCustomModel(llmModelSelection)"
              v-model="llmCustomModelInput"
              type="text"
              :placeholder="t('placeholderCustomModel')"
              class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Keyboard Shortcut (always visible, not in accordion) -->
    <div class="pt-1">
      <div class="flex items-center gap-2">
        <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
          {{ t('keyboardShortcut') }}
        </label>
        <input
          v-model="localPreset.keyboardShortcut"
          @keydown="handleShortcutInput"
          @keyup="handleShortcutKeyUp"
          placeholder="Ctrl+Alt+T, Ctrl+Alt+2"
          class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
        />
        <div class="relative group">
          <Info :size="14" class="text-gray-400 dark:text-gray-500 cursor-help" />
          <div class="absolute bottom-full right-0 mb-1 hidden group-hover:block z-10 w-56">
            <div class="bg-gray-900 dark:bg-gray-700 text-white text-[10px] p-2 rounded shadow-lg">
              {{ t('shortcutHelp') }}
            </div>
          </div>
        </div>
      </div>
      <p v-if="shortcutError" class="text-[10px] text-red-600 mt-0.5">
        {{ shortcutError }}
      </p>
      <!-- Pinned preset checkbox — disabled when already pinned (cannot unpin without selecting another) -->
      <div class="flex items-center gap-2 mt-1">
        <input
          type="checkbox"
          :id="`pinned-preset-${localPreset.id}`"
          :checked="isPinned"
          :disabled="isPinned"
          @change="handlePinChange"
          class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <label
          :for="`pinned-preset-${localPreset.id}`"
          class="text-[10px] text-gray-600 dark:text-gray-400"
          :class="isPinned ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'"
        >
          {{ t('pinnedPresetLabel') }}
        </label>
      </div>
    </div>

    <!-- Unsaved changes warning banner -->
    <div
      v-if="hasUnsavedChanges"
      class="flex items-center justify-between gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded"
    >
      <span class="text-[10px] text-yellow-800 dark:text-yellow-200">
        {{ t('unsavedChanges') }}
      </span>
      <div class="flex gap-2">
        <button
          @click="undoChanges"
          class="px-2 py-1 text-xs rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {{ t('undo') }}
        </button>
        <button
          @click="savePreset"
          class="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {{ t('saveChanges') }}
        </button>
      </div>
    </div>

    <!-- Delete Button -->
    <button
      v-if="canDelete"
      @click="showDeleteDialog = true"
      class="w-full px-2 py-1.5 text-xs rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
    >
      {{ t('deletePreset') }}
    </button>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :title="t('presetDeleteTitle')"
      :message="t('presetDeleteMessage', { params: { name: localPreset.name } })"
      :confirm-text="t('deletePreset')"
      :cancel-text="t('cancel')"
      variant="danger"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />

    <!-- Validation Error Dialog -->
    <ConfirmDialog
      :show="showValidationDialog"
      :title="validationDialogTitle"
      :message="validationDialogMessage"
      :confirm-text="t('ok') || 'OK'"
      :cancel-text="t('cancel')"
      variant="warning"
      @confirm="showValidationDialog = false"
      @cancel="showValidationDialog = false"
    />

    <!-- Expanded prompt modal — full-size textarea overlay -->
    <Teleport to="body">
      <div
        v-if="showPromptModal && localPreset.type === 'llm-prompt'"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showPromptModal = false"
      >
        <!-- Modal fills almost the full popup height with a small margin -->
        <div
          class="w-[360px] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col overflow-hidden"
          style="height: calc(100vh - 24px); max-height: calc(100vh - 24px)"
        >
          <!-- Modal header -->
          <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {{ t('llmPromptLabel') }}
            </span>
            <button
              type="button"
              @click="showPromptModal = false"
              class="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X :size="14" />
            </button>
          </div>
          <!-- Modal body — textarea stretches to fill remaining height -->
          <div class="p-3 flex flex-col gap-2 flex-1 overflow-hidden">
            <textarea
              v-model="localPreset.prompt"
              :placeholder="t('llmPromptPlaceholder')"
              class="w-full flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              autofocus
            />
            <p class="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
              {{ t('llmPromptHint') }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Locked overlay — shown when the preset index exceeds the free limit and user has no Pro access -->
    <div
      v-if="isPresetLocked(presetIndex)"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/90 dark:bg-gray-900/90 rounded-lg backdrop-blur-sm"
    >
      <Lock :size="20" class="text-amber-500" />
      <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center px-4">
        {{ t('presetLockedMessage') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Check, RotateCcw, Info, Lock, Maximize2, X } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { useDraftPreset, type DraftPresetState } from '@/composables/useDraftPreset'
import { usePro } from '@/composables/usePro'
import {
  buildShortcutFromEvent,
  normalizeShortcut,
  KeyboardSequenceDetector,
} from '@/core/utils/keyboardUtils'
import type {
  Preset,
  TranslationProvider,
  LLMProvider,
  LLMPromptPreset,
  CustomTransformation,
} from '@/types/common'
import {
  TransformationEngine,
  applyCustomCharMap,
} from '@/core/transformation/TransformationEngine'
import { getAllCustomTransforms } from '@/services/customTransformService'
import { AVAILABLE_PROVIDERS, getLLMProviders } from '@/config/providers'
import {
  PREDEFINED_MODELS,
  isCustomModel,
  getEffectiveModel,
  getDefaultModel,
  type ModelOption,
} from '@/config/predefinedModels'
import ConfirmDialog from './ConfirmDialog.vue'
import LanguageSelector from './LanguageSelector.vue'

const { t } = useI18nWrapper()
const { loadDraft, saveDraft, clearDraft } = useDraftPreset()

// Debounce timer for draft auto-save
let draftSaveTimer: ReturnType<typeof setTimeout> | null = null

// In-memory mirror of the persisted draft — kept in sync with storage so the
// preset-switch watcher can restore state synchronously (no async read = no flash)
const memoryCachedDraft = ref<DraftPresetState | null>(null)

// Sequence detector for multi-key shortcut capture
const sequenceDetector = new KeyboardSequenceDetector()

// Transformation engine instance for built-in style preview
const transformationEngine = new TransformationEngine()

// Mode definitions driving the 4-pill selector
const PRESET_MODES = [
  { type: 'translation' as const, i18nKey: 'presetModeTranslator' as const },
  { type: 'transformation' as const, i18nKey: 'presetModeTransformer' as const },
  { type: 'custom-transform' as const, i18nKey: 'presetModeCustomTransform' as const },
  { type: 'llm-prompt' as const, i18nKey: 'presetModeLLMPrompt' as const },
] as const

// LLM provider options for the per-preset provider dropdown
const LLM_PROVIDERS = getLLMProviders()

// Maps global TranslationProvider values to their corresponding LLMProvider value.
const PROVIDER_TO_LLM: Record<string, string> = {
  gemini: 'gemini',
  chatgpt: 'chatgpt',
  groq: 'groq',
  ollama: 'ollama',
  openrouter: 'openrouter',
  custom: 'custom',
}

interface Props {
  preset: Preset
  allPresets: Preset[]
  canDelete: boolean
  globalProvider?: TranslationProvider
  isPinned?: boolean
  /** Index of this preset in the presets array — used to determine if it is locked */
  presetIndex: number
}

const props = defineProps<Props>()

const { isPresetLocked } = usePro()

const emit = defineEmits<{
  'update-preset': [preset: Preset]
  'delete-preset': [id: string]
  'set-pinned': [id: string]
}>()

// ─── Local editor state ──────────────────────────────────────────

const localPreset = ref<Preset>({ ...props.preset })
const shortcutError = ref('')
const showDeleteDialog = ref(false)
const showValidationDialog = ref(false)
const showPromptModal = ref(false)
const validationDialogTitle = ref('')
const validationDialogMessage = ref('')

// Shared preview input text (transformation + custom-transform)
const customExampleText = ref('Type to preview...')

// Custom transformations loaded from storage for the dropdown
const customTransforms = ref<CustomTransformation[]>([])

//  Custom provider configuration (reactive proxy for localPreset.customProviderConfig)
const presetConfig = ref<import('@/types/common').PresetProviderConfig>({})

// LLM model selection state (separate from localPreset.llmModel which stores the resolved value)
// llmModelSelection holds the dropdown value (can be 'custom' for providers with predefined models)
// llmCustomModelInput holds the free-text model name when 'custom' is selected
const llmModelSelection = ref('')
const llmCustomModelInput = ref('')

// ─── LLM model helpers ────────────────────────────────────────────

/**
 * Initialize llmModelSelection and llmCustomModelInput from a stored (resolved) model name.
 * Determines whether the stored model is predefined or custom for the given provider.
 */
function initLLMModelState(provider: LLMProvider, storedModel: string) {
  const models = (PREDEFINED_MODELS as Record<string, ModelOption[]>)[provider] || []
  // Providers with no real predefined models (e.g. 'custom', 'ollama') use a plain text input
  const predefinedValues = models.filter((m) => !m.isCustom).map((m) => m.value)

  if (predefinedValues.length === 0) {
    // No dropdown - text input directly stores the model name
    llmModelSelection.value = storedModel
    llmCustomModelInput.value = ''
  } else if (predefinedValues.includes(storedModel)) {
    // Matches a known predefined entry
    llmModelSelection.value = storedModel
    llmCustomModelInput.value = ''
  } else {
    // Unknown model → treat as custom
    llmModelSelection.value = 'custom'
    llmCustomModelInput.value = storedModel
  }
}

/**
 * Reset LLM model state to the provider default when the user selects a different provider.
 * Called via @change on the provider <select>.
 */
function onLLMProviderChange() {
  if (localPreset.value.type !== 'llm-prompt') return
  const provider = (localPreset.value as LLMPromptPreset).llmProvider
  const models = (PREDEFINED_MODELS as Record<string, ModelOption[]>)[provider] || []
  const defaultModel = models.find((m) => !m.isCustom)?.value || ''
  llmModelSelection.value = defaultModel
  llmCustomModelInput.value = ''
}

// ─── Draft persistence ────────────────────────────────────────────

/**
 * Schedule a debounced draft save (400 ms).
 * Only writes if there are actually unsaved changes.
 */
function scheduleDraftSave() {
  if (draftSaveTimer) clearTimeout(draftSaveTimer)
  draftSaveTimer = setTimeout(async () => {
    if (!hasUnsavedChanges.value) return
    const state: DraftPresetState = {
      presetId: props.preset.id,
      // Strip Vue Proxy before storing
      localPreset: JSON.parse(JSON.stringify(localPreset.value)),
      presetConfig: { ...presetConfig.value },
      llmModelSelection: llmModelSelection.value,
      llmCustomModelInput: llmCustomModelInput.value,
      customExampleText: customExampleText.value,
      savedAt: Date.now(),
    }
    // Update memory cache synchronously so the watcher can restore without a storage round-trip
    memoryCachedDraft.value = state
    await saveDraft(state)
  }, 400)
}

/**
 * Load a persisted draft and restore editor state if the draft belongs to the
 * currently displayed preset and passes basic structural validation.
 * Called at the end of onMounted (after baseline init).
 */
/**
 * Apply a validated draft object to the editor state (synchronous).
 * Shared by both the async load path (onMounted) and the sync cache path (watcher).
 */
function applyDraft(draft: DraftPresetState) {
  localPreset.value = draft.localPreset
  if (draft.localPreset.type === 'translation') {
    presetConfig.value = draft.presetConfig || {}
  }
  if (draft.localPreset.type === 'llm-prompt') {
    llmModelSelection.value = draft.llmModelSelection || ''
    llmCustomModelInput.value = draft.llmCustomModelInput || ''
  }
  if (
    draft.localPreset.type === 'transformation' ||
    draft.localPreset.type === 'custom-transform'
  ) {
    if (draft.customExampleText) customExampleText.value = draft.customExampleText
  }
}

/**
 * Load draft from storage, populate the memory cache, and apply to editor state.
 * Only called from onMounted — async is fine here since the component is just mounting.
 */
async function restoreDraftIfValid() {
  try {
    const draft = await loadDraft()
    if (!draft) return
    // Stale draft from a different preset — silently ignore
    if (draft.presetId !== props.preset.id) return
    // Basic structure check to guard against corrupted storage
    if (!draft.localPreset || typeof draft.localPreset.type !== 'string') {
      await clearDraft()
      return
    }
    // Populate memory cache so subsequent tab switches are flash-free
    memoryCachedDraft.value = draft
    applyDraft(draft)
  } catch (e) {
    console.error('[PresetEditor] Failed to restore draft:', e)
    // Non-fatal: falls back to saved preset state
  }
}

/**
 * Synchronous draft restore from memory cache — used by the preset-switch watcher
 * to avoid a storage round-trip (which would cause a visual flash).
 */
function restoreDraftFromCache(presetId: string) {
  const draft = memoryCachedDraft.value
  if (!draft) return
  if (draft.presetId !== presetId) return
  if (!draft.localPreset || typeof draft.localPreset.type !== 'string') {
    memoryCachedDraft.value = null
    clearDraft().catch((e) => console.error('[PresetEditor] Failed to clear invalid cached draft:', e))
    return
  }
  applyDraft(draft)
}

// ─── Lifecycle ────────────────────────────────────────────────────

onMounted(async () => {
  customTransforms.value = await getAllCustomTransforms()
  // Initialize presetConfig from localPreset (baseline)
  if (localPreset.value.type === 'translation' && localPreset.value.customProviderConfig) {
    presetConfig.value = { ...localPreset.value.customProviderConfig }
  }
  // Initialize LLM model selection state (baseline)
  if (localPreset.value.type === 'llm-prompt') {
    initLLMModelState(
      (localPreset.value as LLMPromptPreset).llmProvider,
      (localPreset.value as LLMPromptPreset).llmModel
    )
  }
  // Override baseline with persisted draft if one exists for this preset
  await restoreDraftIfValid()
})

// ─── Computed ─────────────────────────────────────────────────────

// Full list of built-in styles for the style <select>
const transformationStyles = computed(() => transformationEngine.getAllStyles())

// Currently selected custom transformation object (drives live preview)
const selectedCustomTransform = computed(() => {
  if (localPreset.value.type !== 'custom-transform') return null
  const preset = localPreset.value
  return customTransforms.value.find((ct) => ct.id === preset.customTransformId) ?? null
})

// Applies the selected built-in style to the preview text
const transformedPreview = computed(() => {
  if (localPreset.value.type !== 'transformation') return ''
  return transformationEngine.transform(
    customExampleText.value,
    localPreset.value.transformationStyle
  )
})

// Applies the selected custom charMap to the preview text
const customTransformPreview = computed(() => {
  if (!selectedCustomTransform.value) return ''
  return applyCustomCharMap(customExampleText.value, selectedCustomTransform.value.charMap)
})

// Get configuration for the currently selected custom provider
const currentProviderConfig = computed(() => {
  if (
    localPreset.value.type !== 'translation' ||
    !localPreset.value.useCustomProvider ||
    !localPreset.value.customProvider
  ) {
    return null
  }
  return getProviderConfig(localPreset.value.customProvider)
})

// Predefined model list for the current LLM prompt provider (excludes 'custom' provider which has no list)
const llmAvailableModels = computed((): ModelOption[] => {
  if (localPreset.value.type !== 'llm-prompt') return []
  const provider = (localPreset.value as LLMPromptPreset).llmProvider
  if (provider === 'custom') return []
  return (PREDEFINED_MODELS as Record<string, ModelOption[]>)[provider] || []
})

// True when the current LLM provider has at least one non-custom predefined model (show dropdown)
const llmHasPredefinedModels = computed(() => llmAvailableModels.value.some((m) => !m.isCustom))

// The resolved model name based on the current selection state
const resolvedLLMModel = computed(() =>
  isCustomModel(llmModelSelection.value) ? llmCustomModelInput.value : llmModelSelection.value
)

// Per-type dirty check against the original prop
const hasUnsavedChanges = computed(() => {
  if (localPreset.value.type !== props.preset.type) return true

  if (localPreset.value.type === 'translation' && props.preset.type === 'translation') {
    const baseChanged =
      localPreset.value.name !== props.preset.name ||
      localPreset.value.sourceLang !== props.preset.sourceLang ||
      localPreset.value.targetLang !== props.preset.targetLang ||
      localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut ||
      localPreset.value.useCustomProvider !== props.preset.useCustomProvider ||
      localPreset.value.customProvider !== props.preset.customProvider

    if (baseChanged) return true

    // Check if customProviderConfig has changed
    if (localPreset.value.useCustomProvider && localPreset.value.customProvider) {
      const configChanged =
        JSON.stringify(presetConfig.value) !==
        JSON.stringify(props.preset.customProviderConfig || {})
      if (configChanged) return true
    }

    return false
  } else if (
    localPreset.value.type === 'transformation' &&
    props.preset.type === 'transformation'
  ) {
    return (
      localPreset.value.name !== props.preset.name ||
      localPreset.value.transformationStyle !== props.preset.transformationStyle ||
      localPreset.value.exampleText !== props.preset.exampleText ||
      localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut
    )
  } else if (
    localPreset.value.type === 'custom-transform' &&
    props.preset.type === 'custom-transform'
  ) {
    return (
      localPreset.value.name !== props.preset.name ||
      localPreset.value.customTransformId !== props.preset.customTransformId ||
      localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut
    )
  } else if (localPreset.value.type === 'llm-prompt' && props.preset.type === 'llm-prompt') {
    return (
      localPreset.value.name !== props.preset.name ||
      localPreset.value.prompt !== props.preset.prompt ||
      localPreset.value.llmProvider !== props.preset.llmProvider ||
      // Compare the resolved model (not the raw selection) against the saved value
      resolvedLLMModel.value !== props.preset.llmModel ||
      localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut
    )
  }
  return true
})

// ─── Watchers ─────────────────────────────────────────────────────

// Auto-save draft whenever any editor field changes
watch(localPreset, scheduleDraftSave, { deep: true })
watch(presetConfig, scheduleDraftSave, { deep: true })
watch(llmModelSelection, scheduleDraftSave)
watch(llmCustomModelInput, scheduleDraftSave)
watch(customExampleText, scheduleDraftSave)

// Sync local state when parent switches the active preset tab
watch(
  () => props.preset,
  (newPreset) => {
    localPreset.value = { ...newPreset }
    shortcutError.value = ''
    if (newPreset.type === 'transformation' && newPreset.exampleText) {
      customExampleText.value = newPreset.exampleText
    }
    // Sync presetConfig from preset.customProviderConfig
    if (newPreset.type === 'translation' && newPreset.customProviderConfig) {
      presetConfig.value = { ...newPreset.customProviderConfig }
    } else {
      presetConfig.value = {}
    }
    // Sync LLM model selection state
    if (newPreset.type === 'llm-prompt') {
      initLLMModelState(
        (newPreset as LLMPromptPreset).llmProvider,
        (newPreset as LLMPromptPreset).llmModel
      )
    } else {
      llmModelSelection.value = ''
      llmCustomModelInput.value = ''
    }
    // Restore draft synchronously from memory cache — no storage round-trip, no visual flash
    restoreDraftFromCache(newPreset.id)
  },
  { deep: true }
)

// ─── Mode switching ──────────────────────────────────────────────

/**
 * Get provider-specific configuration defaults and requirements
 */
function getProviderConfig(provider: TranslationProvider) {
  const providerOption = AVAILABLE_PROVIDERS.find((p) => p.value === provider)
  const isLLM = providerOption?.isLLM ?? false
  const requiresApiKey = providerOption?.requiresApiKey ?? false

  const config = {
    requiresApiKey,
    requiresBaseUrl: false,
    defaultBaseUrl: '',
    defaultModel: '',
    availableModels: [] as ModelOption[],
  }

  if (isLLM && provider !== 'custom') {
    const providerKey = provider as keyof typeof PREDEFINED_MODELS
    config.availableModels = PREDEFINED_MODELS[providerKey] || []
    config.defaultModel = getDefaultModel(providerKey)
  }

  switch (provider) {
    case 'chatgpt':
      config.requiresBaseUrl = true
      config.defaultBaseUrl = 'https://api.openai.com/v1'
      break
    case 'groq':
      config.requiresBaseUrl = true
      config.defaultBaseUrl = 'https://api.groq.com/openai/v1'
      break
    case 'ollama':
      config.requiresBaseUrl = true
      config.defaultBaseUrl = 'http://localhost:11434/v1'
      break
    case 'openrouter':
      config.requiresBaseUrl = true
      config.defaultBaseUrl = 'https://openrouter.ai/api/v1'
      break
    case 'custom':
      config.requiresBaseUrl = true
      break
  }

  return config
}

/**
 * Handle custom provider change - RESET config (no memorization for presets)
 */
function onCustomProviderChange() {
  if (localPreset.value.type !== 'translation') return
  const provider = localPreset.value.customProvider
  if (!provider) {
    presetConfig.value = {}
    return
  }

  // RESET completely - don't keep old values when changing provider
  const config = getProviderConfig(provider)
  presetConfig.value = {
    baseUrl: config.defaultBaseUrl || undefined,
    model: config.defaultModel || undefined,
  }
}

/**
 * Type guard to validate if a value is a valid preset type.
 */
function isValidPresetType(
  value: unknown
): value is 'translation' | 'transformation' | 'custom-transform' | 'llm-prompt' {
  return ['translation', 'transformation', 'custom-transform', 'llm-prompt'].includes(
    value as string
  )
}

/**
 * Reconstruct the preset shape for the new mode, preserving base fields.
 */
function handleModeChange(
  newType: 'translation' | 'transformation' | 'custom-transform' | 'llm-prompt'
) {
  const base = {
    id: localPreset.value.id,
    name: localPreset.value.name,
    keyboardShortcut: localPreset.value.keyboardShortcut,
    createdAt: localPreset.value.createdAt,
  }

  switch (newType) {
    case 'translation':
      localPreset.value = {
        ...base,
        type: 'translation',
        sourceLang: 'auto',
        targetLang: 'en',
      } as Preset
      break
    case 'transformation':
      localPreset.value = {
        ...base,
        type: 'transformation',
        transformationStyle: 'strikethrough',
        exampleText: customExampleText.value,
      } as Preset
      break
    case 'custom-transform':
      localPreset.value = {
        ...base,
        type: 'custom-transform',
        customTransformId: '',
      } as Preset
      break
    case 'llm-prompt': {
      // Auto-suggest the LLM provider when the global translation provider is also an LLM
      const suggestedProvider = (
        props.globalProvider && PROVIDER_TO_LLM[props.globalProvider]
          ? PROVIDER_TO_LLM[props.globalProvider]
          : 'gemini'
      ) as LLMProvider
      // Initialize with the default model for the suggested provider
      const defaultModel =
        getDefaultModel(suggestedProvider as keyof typeof PREDEFINED_MODELS) || ''
      localPreset.value = {
        ...base,
        type: 'llm-prompt',
        prompt: '',
        llmProvider: suggestedProvider,
        llmModel: defaultModel,
      } as Preset
      // Sync local selection state to the default model
      initLLMModelState(suggestedProvider, defaultModel)
      break
    }
  }
  console.log('[PresetEditor] Mode changed to:', newType)
}

// ─── Pin ─────────────────────────────────────────────────────────

/**
 * Handle pin checkbox change.
 * Disabled at the DOM level when already pinned, so this only fires when pinning a new preset.
 */
function handlePinChange() {
  emit('set-pinned', props.preset.id)
}

// ─── Undo / Options ──────────────────────────────────────────────

/** Revert local state to the last-saved prop */
function undoChanges() {
  localPreset.value = { ...props.preset }
  shortcutError.value = ''
  if (props.preset.type === 'transformation' && props.preset.exampleText) {
    customExampleText.value = props.preset.exampleText
  }
  // Restore presetConfig
  if (props.preset.type === 'translation' && props.preset.customProviderConfig) {
    presetConfig.value = { ...props.preset.customProviderConfig }
  } else {
    presetConfig.value = {}
  }
  // Restore LLM model selection state
  if (props.preset.type === 'llm-prompt') {
    initLLMModelState(
      (props.preset as LLMPromptPreset).llmProvider,
      (props.preset as LLMPromptPreset).llmModel
    )
  }
  // Remove persisted draft so it does not restore on next popup open
  memoryCachedDraft.value = null
  clearDraft().catch((e) => console.error('[PresetEditor] Failed to clear draft on undo:', e))
}

/** Navigate to the extension options page (custom-transform manager) */
function openOptionsPage() {
  chrome.runtime.openOptionsPage()
}

// ─── Shortcut input ──────────────────────────────────────────────

/** Capture keys inside the shortcut field and build the shortcut string */
function handleShortcutInput(event: KeyboardEvent) {
  if (event.key === 'Backspace' || event.key === 'Delete') {
    sequenceDetector.reset()
    return
  }
  event.preventDefault()

  const sequenceShortcut = sequenceDetector.processKeyDown(event)
  const simpleShortcut = buildShortcutFromEvent(event)
  const shortcut = sequenceShortcut || simpleShortcut

  if (shortcut) {
    localPreset.value.keyboardShortcut = shortcut
    validateShortcut()
  }
}

/** Reset the sequence detector on key release */
function handleShortcutKeyUp(event: KeyboardEvent) {
  sequenceDetector.processKeyUp(event)
}

// ─── Validation ──────────────────────────────────────────────────

/**
 * Format check + uniqueness check for the shortcut string.
 * Also checks for prefix conflicts (e.g., Alt+T vs Alt+T+1).
 */
function validateShortcut(): boolean {
  const shortcut = localPreset.value.keyboardShortcut.trim()

  if (!shortcut) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  const validPattern = /^(Ctrl|Alt|Shift|Meta)(\+(Ctrl|Alt|Shift|Meta|[A-Z0-9]))*$/i
  if (!validPattern.test(shortcut)) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  const tokens = shortcut.split('+').map((tok) => tok.trim())
  const modifiers = ['ctrl', 'alt', 'shift', 'meta', 'control', 'cmd', 'command', 'super']
  const keys = tokens.filter((token) => !modifiers.includes(token.toLowerCase()))

  // REJECT modifier-only shortcuts (Alt, Ctrl, Shift, Meta alone)
  if (keys.length === 0) {
    shortcutError.value =
      t('shortcutModifierOnly') || 'Modifier-only shortcuts (Alt, Ctrl, etc.) are not allowed'
    return false
  }

  if (keys.length > 2) {
    shortcutError.value = t('shortcutTooManyKeys')
    return false
  }

  const normalizedShortcut = normalizeShortcut(shortcut)
  if (!normalizedShortcut) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  // Check for exact duplicates
  const duplicate = props.allPresets.find(
    (p) => p.id !== props.preset.id && normalizeShortcut(p.keyboardShortcut) === normalizedShortcut
  )

  if (duplicate) {
    shortcutError.value = t('shortcutDuplicate', { params: { name: duplicate.name } })
    return false
  }

  // Check for prefix conflicts
  // A conflict exists if:
  // - New shortcut is a prefix of an existing one (e.g., Alt+T vs existing Alt+T+1)
  // - An existing shortcut is a prefix of the new one (e.g., existing Alt+T vs new Alt+T+1)
  for (const preset of props.allPresets) {
    if (preset.id === props.preset.id) continue

    const existingNormalized = normalizeShortcut(preset.keyboardShortcut)

    // Check if new is a prefix of existing (e.g., Alt+T vs Alt+T+1)
    if (existingNormalized.startsWith(normalizedShortcut + '+')) {
      shortcutError.value = `Conflict: "${normalizedShortcut}" is a prefix of "${existingNormalized}" (${preset.name})`
      showValidationError(
        t('shortcutConflictTitle') || 'Shortcut Conflict',
        `The shortcut "${normalizedShortcut}" conflicts with "${existingNormalized}" used by "${preset.name}".\n\nWhen you press "${normalizedShortcut}", it will be triggered immediately and you won't be able to use "${existingNormalized}".\n\nPlease remove or modify "${preset.name}" first, or choose a different shortcut.`
      )
      return false
    }

    // Check if existing is a prefix of new (e.g., existing Alt+T vs new Alt+T+1)
    if (normalizedShortcut.startsWith(existingNormalized + '+')) {
      shortcutError.value = `Conflict: "${existingNormalized}" (${preset.name}) is a prefix of "${normalizedShortcut}"`
      showValidationError(
        t('shortcutConflictTitle') || 'Shortcut Conflict',
        `The shortcut "${normalizedShortcut}" conflicts with "${existingNormalized}" used by "${preset.name}".\n\nWhen you press "${existingNormalized}", it will be triggered immediately and you won't be able to use "${normalizedShortcut}".\n\nPlease remove or modify "${preset.name}" first, or choose a different shortcut.`
      )
      return false
    }
  }

  shortcutError.value = ''
  return true
}

// ─── Save / Delete ───────────────────────────────────────────────

/**
 * Display validation error dialog
 */
function showValidationError(title: string, message: string) {
  validationDialogTitle.value = title
  validationDialogMessage.value = message
  showValidationDialog.value = true
}

/** Type-specific validation then emit the updated preset */
function savePreset() {
  if (!validateShortcut()) return

  if (localPreset.value.type === 'transformation') {
    if (!localPreset.value.transformationStyle) {
      console.error('[PresetEditor] Transformation style required')
      return
    }
    // Persist the example text into the preset payload
    if (customExampleText.value !== localPreset.value.exampleText) {
      localPreset.value.exampleText = customExampleText.value
    }
  } else if (localPreset.value.type === 'translation') {
    if (!localPreset.value.sourceLang || !localPreset.value.targetLang) {
      console.error('[PresetEditor] Source and target languages required')
      return
    }
    // Validate custom provider if enabled
    if (localPreset.value.useCustomProvider) {
      if (!localPreset.value.customProvider) {
        showValidationError(
          t('validationError') || 'Validation Error',
          t('validationCustomProviderRequired')
        )
        return
      }

      const config = getProviderConfig(localPreset.value.customProvider)

      // Validate required fields based on provider configuration
      if (config.requiresApiKey && !presetConfig.value.apiKey) {
        showValidationError(
          t('validationError') || 'Validation Error',
          'API key is required for this provider'
        )
        return
      }

      if (config.requiresBaseUrl && !presetConfig.value.baseUrl) {
        showValidationError(
          t('validationError') || 'Validation Error',
          'Base URL is required for this provider'
        )
        return
      }

      // Validate model for LLM providers
      if (config.availableModels.length > 0) {
        const effectiveModel = getEffectiveModel(
          presetConfig.value.model || '',
          presetConfig.value.customModel
        )
        if (!effectiveModel) {
          showValidationError(
            t('validationError') || 'Validation Error',
            'Model is required for this provider'
          )
          return
        }
      } else if (localPreset.value.customProvider === 'custom' && !presetConfig.value.model) {
        // For custom provider, model is always required
        showValidationError(
          t('validationError') || 'Validation Error',
          'Model is required for custom provider'
        )
        return
      }

      // Copy presetConfig to localPreset.customProviderConfig before saving
      localPreset.value.customProviderConfig = { ...presetConfig.value }
    }
  } else if (localPreset.value.type === 'custom-transform') {
    if (!localPreset.value.customTransformId) {
      showValidationError(
        t('validationError') || 'Validation Error',
        t('validationCustomTransformRequired')
      )
      return
    }
  } else if (localPreset.value.type === 'llm-prompt') {
    if (!localPreset.value.prompt) {
      showValidationError(
        t('validationError') || 'Validation Error',
        t('validationLLMPromptRequired')
      )
      return
    }
    if (!localPreset.value.llmProvider) {
      showValidationError(
        t('validationError') || 'Validation Error',
        t('validationLLMProviderRequired')
      )
      return
    }
    // Resolve the effective model from the local selection state
    const effectiveModel = resolvedLLMModel.value
    if (!effectiveModel) {
      showValidationError(
        t('validationError') || 'Validation Error',
        t('validationLLMModelRequired')
      )
      return
    }
    // Persist the resolved model name (never 'custom') into the preset
    localPreset.value.llmModel = effectiveModel
  }

  emit('update-preset', { ...localPreset.value })
  // Remove persisted draft now that the preset is officially saved
  memoryCachedDraft.value = null
  clearDraft().catch((e) => console.error('[PresetEditor] Failed to clear draft on save:', e))
  console.log('[PresetEditor] Preset saved:', localPreset.value)
}

/** Forward delete after dialog confirmation */
function handleDeleteConfirm() {
  showDeleteDialog.value = false
  emit('delete-preset', props.preset.id)
}
</script>

<style scoped>
.preset-editor {
  padding-bottom: 0.5rem;
}

/* MathSymbols @font-face is declared in popup.html */
.preview-transformed {
  font-family:
    'MathSymbols', ui-monospace, 'Cascadia Code', 'Source Code Pro', 'Menlo', 'Consolas',
    'Courier New', monospace;
}
</style>
