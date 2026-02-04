<template>
  <div class="preset-editor space-y-1.5">
    <!-- Preset Name -->
    <div class="relative">
      <label class="block text-[10px] font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
        {{ t('presetName') }}
      </label>
      <div class="flex gap-1 items-center">
        <input
          v-model="localPreset.name"
          :placeholder="t('presetNamePlaceholder')"
          class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <!-- Save/Undo buttons (only visible if changes detected) -->
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
    </div>

    <!-- Preset Type Toggle -->
    <div class="preset-type-toggle">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          :checked="isTransformationMode"
          @change="handleTypeToggle"
          class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{
          t('enableTransformationMode')
        }}</span>
      </label>
      <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
        {{ t('transformationModeDescription') }}
      </p>
    </div>

    <!-- Translation Fields (show if type === 'translation') -->
    <template v-if="!isTransformationMode">
      <!-- Source Language -->
      <div>
      <label class="block text-[10px] font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
        {{ t('sourceLanguage') }}
      </label>
      <LanguageSelector
        v-model="localPreset.sourceLang"
        :placeholder="t('searchLanguagePlaceholder')"
        input-id="source-language-selector"
        include-auto-detect
      />
      </div>

      <!-- Target Language -->
      <div>
        <label class="block text-[10px] font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
          {{ t('targetLanguage') }}
        </label>
        <LanguageSelector
          v-model="localPreset.targetLang"
          :placeholder="t('searchLanguagePlaceholder')"
          input-id="target-language-selector"
        />
      </div>
    </template>

    <!-- Transformation Fields (show if type === 'transformation') -->
    <template v-else>
      <!-- Style Selector -->
      <div>
        <label class="block text-[10px] font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
          {{ t('transformationStyle') }}
        </label>
        <select
          v-model="localPreset.transformationStyle"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-unicode"
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

      <!-- Live Preview with Customizable Text -->
      <div v-if="localPreset.transformationStyle" class="space-y-1">
        <label class="block text-[10px] font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
          {{ t('previewExample') }}
        </label>
        <input
          v-model="customExampleText"
          :placeholder="t('previewPlaceholder')"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div
          class="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 preview-transformed"
        >
          {{ transformedPreview }}
        </div>
      </div>
    </template>

    <!-- Keyboard Shortcut -->
    <div>
      <label class="block text-[10px] font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
        {{ t('keyboardShortcut') }}
      </label>
      <input
        v-model="localPreset.keyboardShortcut"
        @keydown="handleShortcutInput"
        @keyup="handleShortcutKeyUp"
        placeholder="Alt+T, Alt+T+1, or Alt"
        class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
      />
      <p v-if="shortcutError" class="text-[10px] text-red-600 mt-0.5">
        {{ shortcutError }}
      </p>
      <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
        {{ t('shortcutHelp') }}
      </p>
    </div>

    <!-- Unsaved changes warning -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Check, RotateCcw } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import {
  buildShortcutFromEvent,
  normalizeShortcut,
  KeyboardSequenceDetector,
} from '@/core/utils/keyboardUtils'
import type { Preset } from '@/types/common'
import { TransformationEngine } from '@/core/transformation/TransformationEngine'
import ConfirmDialog from './ConfirmDialog.vue'
import LanguageSelector from './LanguageSelector.vue'

const { t } = useI18nWrapper()

// Sequence detector for multi-key shortcuts
const sequenceDetector = new KeyboardSequenceDetector()

// Transformation engine for preview
const transformationEngine = new TransformationEngine()

interface Props {
  preset: Preset
  allPresets: Preset[]
  canDelete: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-preset': [preset: Preset]
  'delete-preset': [id: string]
}>()

// Local copy of preset for editing
const localPreset = ref<Preset>({ ...props.preset })
const shortcutError = ref('')
const showDeleteDialog = ref(false)

// Transformation-specific state
const customExampleText = ref('Type to preview...')

// Check if we're in transformation mode
const isTransformationMode = computed(() => localPreset.value.type === 'transformation')

// Get all transformation styles for selector
const transformationStyles = computed(() => transformationEngine.getAllStyles())

// Live preview of transformation
const transformedPreview = computed(() => {
  if (localPreset.value.type !== 'transformation') return ''
  return transformationEngine.transform(customExampleText.value, localPreset.value.transformationStyle)
})

// Detect unsaved changes
const hasUnsavedChanges = computed(() => {
  if (localPreset.value.type === 'transformation' && props.preset.type === 'transformation') {
    return (
      localPreset.value.name !== props.preset.name ||
      localPreset.value.transformationStyle !== props.preset.transformationStyle ||
      localPreset.value.exampleText !== props.preset.exampleText ||
      localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut
    )
  } else if (localPreset.value.type === 'translation' && props.preset.type === 'translation') {
    return (
      localPreset.value.name !== props.preset.name ||
      localPreset.value.sourceLang !== props.preset.sourceLang ||
      localPreset.value.targetLang !== props.preset.targetLang ||
      localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut
    )
  }
  // Type changed
  return true
})

// Watch for external preset changes (e.g., when switching tabs)
watch(
  () => props.preset,
  (newPreset) => {
    localPreset.value = { ...newPreset }
    shortcutError.value = ''
  },
  { deep: true }
)

/**
 * Handle type toggle between translation and transformation
 */
function handleTypeToggle() {
  // Check current type and switch to the opposite
  if (localPreset.value.type === 'translation') {
    // Currently translation, switch to transformation
    localPreset.value = {
      id: localPreset.value.id,
      name: localPreset.value.name,
      keyboardShortcut: localPreset.value.keyboardShortcut,
      createdAt: localPreset.value.createdAt,
      type: 'transformation',
      transformationStyle: 'strikethrough',
      exampleText: customExampleText.value,
    } as Preset
    console.log('[PresetEditor] Switched to transformation mode')
  } else {
    // Currently transformation, switch to translation
    localPreset.value = {
      id: localPreset.value.id,
      name: localPreset.value.name,
      keyboardShortcut: localPreset.value.keyboardShortcut,
      createdAt: localPreset.value.createdAt,
      type: 'translation',
      sourceLang: 'auto',
      targetLang: 'en',
    } as Preset
    console.log('[PresetEditor] Switched to translation mode')
  }
}

/**
 * Undo changes to the local preset, reverting to the passed prop
 */
function undoChanges() {
  localPreset.value = { ...props.preset }
  shortcutError.value = ''
  // Reset example text if transformation preset
  if (props.preset.type === 'transformation' && props.preset.exampleText) {
    customExampleText.value = props.preset.exampleText
  }
}

/**
 * Handle keyboard input for shortcut field
 * Supports multi-key sequences (Alt+T+1), single keys (T), modifiers (Alt), etc.
 */
function handleShortcutInput(event: KeyboardEvent) {
  // Allow Backspace and Delete for editing
  if (event.key === 'Backspace' || event.key === 'Delete') {
    sequenceDetector.reset()
    return
  }

  event.preventDefault()

  // Process through sequence detector for multi-key support
  const sequenceShortcut = sequenceDetector.processKeyDown(event)

  // Also build simple shortcut for single-key shortcuts
  const simpleShortcut = buildShortcutFromEvent(event)

  // Use sequence if it's longer, otherwise use simple
  const shortcut = sequenceShortcut || simpleShortcut

  // Only update if we got a valid shortcut (not null)
  if (shortcut) {
    localPreset.value.keyboardShortcut = shortcut
    validateShortcut()
  }
}

/**
 * Handle keyup to reset sequence detector
 */
function handleShortcutKeyUp(event: KeyboardEvent) {
  sequenceDetector.processKeyUp(event)
}

/**
 * Validate shortcut format and uniqueness (without saving)
 * Accepts:
 * - Modifier only: "Alt", "Ctrl"
 * - Modifier + key: "Alt+T", "Ctrl+1"
 * - Modifier + 2 keys: "Alt+T+1", "Ctrl+A+B" (max 2 keys)
 *
 * DOES NOT accept:
 * - Single key without modifier (e.g., "T" or "1")
 * - More than 2 keys after modifiers (e.g., "Alt+A+B+C")
 *
 * Handles permutations: "Alt+T+1" === "Alt+1+T"
 */
function validateShortcut(): boolean {
  const shortcut = localPreset.value.keyboardShortcut.trim()

  // Validate format - must be non-empty and contain valid characters
  if (!shortcut) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  // Valid pattern: must have at least one modifier
  // Examples: "Alt", "Alt+T", "Alt+T+1", "Ctrl+Alt+Shift+A"
  // INVALID: "T", "1" (no modifier)
  const validPattern = /^(Ctrl|Alt|Shift|Meta)(\+(Ctrl|Alt|Shift|Meta|[A-Z0-9]))*$/i
  if (!validPattern.test(shortcut)) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  // Count non-modifier keys
  const tokens = shortcut.split('+').map((t) => t.trim())
  const modifiers = ['ctrl', 'alt', 'shift', 'meta', 'control', 'cmd', 'command', 'super']
  const keys = tokens.filter((token) => !modifiers.includes(token.toLowerCase()))

  // Reject if more than 2 keys
  if (keys.length > 2) {
    shortcutError.value = t('shortcutTooManyKeys')
    return false
  }

  // Normalize shortcuts for comparison to ensure consistency (handles permutations)
  const normalizedShortcut = normalizeShortcut(shortcut)

  // Reject if normalization returned empty (e.g., single key without modifier)
  if (!normalizedShortcut) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  // Validate uniqueness (CRITICAL) - uses normalized shortcuts to handle permutations
  const duplicate = props.allPresets.find(
    (p) => p.id !== props.preset.id && normalizeShortcut(p.keyboardShortcut) === normalizedShortcut
  )

  if (duplicate) {
    shortcutError.value = t('shortcutDuplicate', { params: { name: duplicate.name } })
    return false
  }

  shortcutError.value = ''
  return true
}

/**
 * Save preset changes (called only when user clicks save button)
 */
function savePreset() {
  // Validate shortcut before saving
  if (!validateShortcut()) {
    return // Don't save if validation fails
  }

  // Type-specific validation
  if (localPreset.value.type === 'transformation') {
    if (!localPreset.value.transformationStyle) {
      console.error('[PresetEditor] Transformation style required')
      return
    }
    // Update exampleText if changed
    if (customExampleText.value !== localPreset.value.exampleText) {
      localPreset.value.exampleText = customExampleText.value
    }
  } else if (localPreset.value.type === 'translation') {
    if (!localPreset.value.sourceLang || !localPreset.value.targetLang) {
      console.error('[PresetEditor] Source and target languages required')
      return
    }
  }

  // Emit the update
  emit('update-preset', { ...localPreset.value })
  console.log('[PresetEditor] Preset saved:', localPreset.value)
}

/**
 * Handle delete confirmation from dialog
 */
function handleDeleteConfirm() {
  // Close dialog
  showDeleteDialog.value = false

  // Emit delete event
  emit('delete-preset', props.preset.id)
}
</script>

<style scoped>
.preset-editor {
  padding-bottom: 0.5rem;
}

/* MathSymbols @font-face is declared in popup.html — it covers U+1D400-U+1D7FF
   and U+2100-U+214F via unicode-range so only those codepoints use it.
   Everything else stays monospace as normal. */
.preview-transformed {
  font-family:
    'MathSymbols', ui-monospace, 'Cascadia Code', 'Source Code Pro', 'Menlo', 'Consolas',
    'Courier New', monospace;
}
</style>
